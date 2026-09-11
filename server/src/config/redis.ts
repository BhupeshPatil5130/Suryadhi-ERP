import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isConnected = false;

// Check if external Redis is configured (avoid attempting localhost in cloud production like Render)
const isLocalhostRedis =
  (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost') || process.env.REDIS_URL.includes('127.0.0.1')) &&
  (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost' || process.env.REDIS_HOST === '127.0.0.1');

const shouldAttemptConnect = config.isDev ? true : !isLocalhostRedis;

if (shouldAttemptConnect) {
  try {
    redisClient = new Redis(config.redis.url || {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
    }, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.info('ℹ️ Redis unreachable; falling back to in-memory store for rate limiting and auth caching.');
          return null; // Stop reconnect loop to avoid memory leaks & log spam
        }
        return Math.min(times * 500, 2000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info('✅ Redis connected successfully for distributed rate limiting & caching');
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.on('error', (err: any) => {
      isConnected = false;
      if (config.isDev) {
        // In development, keep log message clean
      } else {
        logger.warn({ err: err.message }, '⚠️ Redis connection notice');
      }
    });

    // Initiate connection asynchronously
    redisClient.connect().catch((err) => {
      isConnected = false;
      if (config.isDev) {
        logger.info('ℹ️ Redis server not reachable locally; rate limiting will use in-memory store.');
      } else {
        logger.info(`ℹ️ Redis not reachable (${err.message}); rate limiting & caching using in-memory store.`);
      }
    });
  } catch (err: any) {
    logger.warn(`Failed to initialize Redis client: ${err.message}`);
    redisClient = null;
  }
} else {
  logger.info('ℹ️ External Redis not configured in production; using in-memory store for rate limiting & caching.');
}

export { redisClient };
export const isRedisReady = () => Boolean(redisClient && isConnected);
export default redisClient;
