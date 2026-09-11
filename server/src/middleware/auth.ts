import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { redisClient, isRedisReady } from '../config/redis';

export interface JwtPayload {
  userId: string;
  role: string;
  schoolId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      authMode?: 'bearer' | 'cookie';
    }
  }
}

// In-memory user cache with TTL fallback
const userMemoryCache = new Map<string, { user: { id: string; role: string; schoolId: string | null }; expiresAt: number }>();

async function getCachedUser(userId: string): Promise<{ id: string; role: string; schoolId: string | null } | null> {
  // Check Redis if connected
  if (isRedisReady() && redisClient) {
    try {
      const cached = await redisClient.get(`auth:user:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore and fallback
    }
  }

  // Memory fallback
  const mem = userMemoryCache.get(userId);
  if (mem) {
    if (Date.now() < mem.expiresAt) {
      return mem.user;
    }
    userMemoryCache.delete(userId);
  }

  return null;
}

async function setCachedUser(userId: string, user: { id: string; role: string; schoolId: string | null }, ttlSeconds = 60): Promise<void> {
  if (isRedisReady() && redisClient) {
    try {
      await redisClient.set(`auth:user:${userId}`, JSON.stringify(user), 'EX', ttlSeconds);
    } catch {
      // ignore
    }
  }

  userMemoryCache.set(userId, {
    user,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateUserCache(userId: string): Promise<void> {
  userMemoryCache.delete(userId);
  if (isRedisReady() && redisClient) {
    try {
      await redisClient.del(`auth:user:${userId}`);
    } catch {
      // ignore
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check Authorization header first, then cookies
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    let authMode: 'bearer' | 'cookie' | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      authMode = 'bearer';
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      authMode = 'cookie';
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    req.authMode = authMode;
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify user with 60s cache to avoid redundant DB roundtrips on every request
    let user = await getCachedUser(decoded.userId);

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, role: true, schoolId: true },
      });

      if (!user) {
        res.status(401).json({ error: 'User not found or inactive' });
        return;
      }

      await setCachedUser(decoded.userId, user, 60);
    }

    req.user = {
      userId: user.id,
      role: user.role,
      schoolId: user.schoolId || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }
  } catch {
    // Silently continue without auth
  }
  next();
};
