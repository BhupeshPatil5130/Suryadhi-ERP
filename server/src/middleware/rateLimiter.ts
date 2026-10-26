import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { config } from '../config';
import { redisClient, isRedisReady } from '../config/redis';

// Use RedisStore when Redis client is available; gracefully handles offline development
const createStore = (prefix: string) => {
  if (!redisClient) return undefined;

  try {
    const store = new RedisStore({
      sendCommand: async (...args: string[]) => {
        // Handle constructor script loading if Redis is still connecting or offline
        if (args[0] === 'SCRIPT' && args[1] === 'LOAD' && !isRedisReady()) {
          return 'offline';
        }
        if (!isRedisReady()) {
          throw new Error('Redis not connected');
        }
        return (redisClient as any).call(...args);
      },
      prefix,
    });

    // Re-load Lua scripts once Redis connection is fully established
    redisClient.on('ready', () => {
      store.loadIncrementScript().catch(() => {});
      store.loadGetScript().catch(() => {});
    });

    return store;
  } catch {
    return undefined;
  }
};

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:api:'),
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => {
    // Use authenticated user ID if available, otherwise IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:auth:'),
  message: {
    error: 'Too many login attempts, please try again in 15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

