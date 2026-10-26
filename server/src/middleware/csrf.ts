import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      authMode?: 'bearer' | 'cookie';
      csrfToken?: string;
    }
  }
}

/**
 * Generate a cryptographically secure CSRF token and set it in a non-httpOnly cookie
 * so the frontend client can read it and send it in custom headers.
 */
export function setCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  const isProd = config.nodeEnv === 'production';
  const cookieOptions = {
    httpOnly: false, // Must be readable by client JS to include in headers
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('csrfToken', token, cookieOptions);
  res.cookie('XSRF-TOKEN', token, cookieOptions);
  return token;
}

/**
 * Double-submit cookie CSRF protection middleware.
 * Verifies that requests authenticated via cookies contain a matching CSRF header.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods do not alter state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // If no csrf cookie exists, set one on safe requests
    if (!req.cookies?.csrfToken && !req.cookies?.['XSRF-TOKEN']) {
      setCsrfCookie(res);
    }
    return next();
  }

  // 1. Exempt authentication, public, and health endpoints from CSRF verification.
  // Auth endpoints (login, signup, refresh, logout) establish/clear credentials and must not be blocked
  // by stale or absent session cookies from prior visits.
  const rawPath = (req.originalUrl || req.url || req.path || '').split('?')[0].toLowerCase();
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/csrf-token',
    '/api/health',
    '/health',
    '/api/seed',
  ];

  if (exemptPaths.some((exempt) => rawPath === exempt || rawPath.endsWith(exempt))) {
    return next();
  }

  // 2. If request is authenticated via Bearer token in Authorization header,
  // it is immune to standard browser cross-site request forgery.
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // 3. If the request was authenticated using cookies, enforce CSRF token check
  if (req.cookies?.accessToken || req.authMode === 'cookie') {
    const expectedToken = req.cookies?.csrfToken || req.cookies?.['XSRF-TOKEN'];
    const providedToken =
      (req.headers['x-csrf-token'] as string) ||
      (req.headers['x-xsrf-token'] as string) ||
      (req.body?._csrf as string);

    if (!expectedToken || !providedToken || expectedToken !== providedToken) {
      res.status(403).json({
        error: 'Forbidden: Invalid or missing CSRF token',
        code: 'CSRF_VALIDATION_FAILED',
      });
      return;
    }
  }

  next();
}
