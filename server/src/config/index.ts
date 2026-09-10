import path from 'path';

// Try to load dotenv, but don't crash if it's not available
// Prisma already loads .env for database connections
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv');
  // Try project root first (d:\ERP\.env), then server root (d:\ERP\server\.env)
  const serverRoot = path.resolve(__dirname, '../../.env');
  const projectRoot = path.resolve(__dirname, '../../../.env');

  const result = dotenv.config({ path: serverRoot });
  if (result.error) {
    dotenv.config({ path: projectRoot });
  }
} catch {
  // dotenv not installed, rely on environment variables being set externally
  console.warn('dotenv not found, using system environment variables');
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
} as const;
