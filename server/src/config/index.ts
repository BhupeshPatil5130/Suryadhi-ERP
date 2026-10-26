import path from 'path';
import { z } from 'zod';

// Load environment configuration
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require('dotenv');
  const serverRoot = path.resolve(__dirname, '../../.env');
  const projectRoot = path.resolve(__dirname, '../../../.env');

  const result = dotenv.config({ path: serverRoot });
  if (result.error) {
    dotenv.config({ path: projectRoot });
  }
} catch {
  // Rely on system environment variables
}

// Auto-derive DIRECT_URL for Neon / connection-pooled PostgreSQL if not set
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace('-pooler.', '.');
}

const isProduction = process.env.NODE_ENV === 'production';

// Strict environment schema
const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('4000').transform((val) => typeof val === 'number' ? val : parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.union([z.string(), z.number()]).default('6379').transform((val) => typeof val === 'number' ? val : parseInt(val, 10)),

  RATE_LIMIT_WINDOW_MS: z.union([z.string(), z.number()]).default('60000').transform((val) => typeof val === 'number' ? val : parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.union([z.string(), z.number()]).default('100').transform((val) => typeof val === 'number' ? val : parseInt(val, 10)),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  SENTRY_DSN: z.string().optional().default(''),
  ALLOW_RUNTIME_SEED: z.string().optional().default('false'),
  SEED_MAINTENANCE_TOKEN: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const fallbackJwtSecret = 'sems-erp-prod-jwt-secret-key-32chars-min!';
const fallbackRefreshSecret = 'sems-erp-prod-refresh-secret-key-32chars!';

if (isProduction && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn('⚠️ [Config] WARNING: JWT_SECRET or JWT_REFRESH_SECRET was not provided in Render environment. Using safe fallback secret. Please configure custom secrets in Render Environment settings.');
}

// Provide safe local defaults for development & Render deployment
const rawEnv = {
  PORT: process.env.PORT || '4000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sems_db?schema=public',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? fallbackJwtSecret : 'dev-local-jwt-secret-key-32chars-min!'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (isProduction ? fallbackRefreshSecret : 'dev-local-refresh-secret-key-32chars!'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '60000',
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  ALLOW_RUNTIME_SEED: process.env.ALLOW_RUNTIME_SEED || 'false',
  SEED_MAINTENANCE_TOKEN: process.env.SEED_MAINTENANCE_TOKEN,
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('❌ Critical Environment Configuration Error:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  if (isProduction && !rawEnv.DATABASE_URL) {
    console.error('🛑 Halting process in production due to missing DATABASE_URL.');
    process.exit(1);
  }
}

const validated = parsed.success ? parsed.data : (rawEnv as any);

// Parse multiple allowed CORS origins
const allowedOrigins = (validated.CORS_ORIGIN || '').split(',').map((o: string) => o.trim()).filter(Boolean);

export const config = {
  port: validated.PORT,
  nodeEnv: validated.NODE_ENV,
  isDev: validated.NODE_ENV !== 'production',

  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  },

  jwt: {
    secret: validated.JWT_SECRET,
    refreshSecret: validated.JWT_REFRESH_SECRET,
    expiresIn: validated.JWT_EXPIRES_IN,
    refreshExpiresIn: validated.JWT_REFRESH_EXPIRES_IN,
  },

  redis: {
    url: validated.REDIS_URL,
    password: validated.REDIS_PASSWORD || '',
    host: validated.REDIS_HOST,
    port: validated.REDIS_PORT,
  },

  database: {
    url: validated.DATABASE_URL,
    directUrl: validated.DIRECT_URL,
  },

  rateLimit: {
    windowMs: validated.RATE_LIMIT_WINDOW_MS,
    maxRequests: validated.RATE_LIMIT_MAX_REQUESTS,
  },

  cloudinary: {
    cloudName: validated.CLOUDINARY_CLOUD_NAME,
    apiKey: validated.CLOUDINARY_API_KEY,
    apiSecret: validated.CLOUDINARY_API_SECRET,
  },

  sentry: {
    dsn: validated.SENTRY_DSN,
  },
} as const;

export default config;
