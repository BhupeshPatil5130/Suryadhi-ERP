// Auto-derive DIRECT_URL for Neon PostgreSQL if not set (bypasses pooler advisory lock issue)
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace('-pooler.', '.');
}

import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, rateLimiter, requestId, csrfProtection } from './middleware';
import prisma from './config/database';
import { initDatabase } from './config/dbInit';

// Import routers
import authRouter from './modules/auth/router';
import dashboardRouter from './modules/dashboard/router';
import enquiryRouter from './modules/enquiry/router';
import admissionRouter from './modules/admission/router';
import feeRouter from './modules/fees/router';
import soaRouter from './modules/soa/router';
import reportsRouter from './modules/reports/router';
import attendanceRouter from './modules/attendance/router';
import academicsRouter from './modules/academics/router';
import studentsRouter from './modules/students/router';
import operationsRouter from './modules/operations/router';
import enrollmentRouter from './modules/enrollment/router';
import graduationRouter from './modules/graduation/router';
import transfersRouter from './modules/transfers/router';
import quitRouter from './modules/quit/router';
import franchiseeRouter from './modules/franchisee/router';
import communicationsRouter from './modules/communications/router';
import lookupsRouter from './modules/lookups/router';
import downloadsRouter from './modules/downloads/router';
import supportRouter from './modules/support/router';
import settingsRouter from './modules/settings/router';

const app = express();

// ─── Security Middleware ───────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Prevent CSP from breaking frontend assets/inline scripts
}));

const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Allow curl, mobile, server-to-server, Render health checks
  const configuredOrigins = Array.isArray(config.cors.origin)
    ? config.cors.origin
    : [config.cors.origin];

  if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
    return true;
  }
  // Automatically allow all *.onrender.com subdomains, localhost, and 127.0.0.1
  if (origin.endsWith('.onrender.com') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'Origin rejected by CORS');
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token', 'X-XSRF-Token'],
}));

// ─── Request ID (Correlation) ──────────────────────────────
app.use(requestId);

// ─── Parsing Middleware ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── CSRF Protection ───────────────────────────────────────
app.use(csrfProtection);

// ─── Logging ───────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ─────────────────────────────────────────
app.use('/api/', rateLimiter);

// ─── Health Check ──────────────────────────────────────────
const handleHealth = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/enquiries', enquiryRouter);
app.use('/api/admissions', admissionRouter);
app.use('/api/fees', feeRouter);
app.use('/api/soa', soaRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/academics', academicsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/enrollment', enrollmentRouter);
app.use('/api/graduation', graduationRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/quit', quitRouter);
app.use('/api/franchisee', franchiseeRouter);
app.use('/api/communications', communicationsRouter);
app.use('/api/lookups', lookupsRouter);
app.use('/api/downloads', downloadsRouter);
app.use('/api/support', supportRouter);
app.use('/api/settings', settingsRouter);

// ─── Static Frontend Serving (Fullstack Render Deployment) ─────────
const candidateDistDirs = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];

const clientDistPath = candidateDistDirs.find((dir) => fs.existsSync(dir));

if (clientDistPath) {
  logger.info(`📦 Serving static client build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ─── Error Handling ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────
const server = app.listen(config.port, '0.0.0.0', async () => {
  logger.info(`🚀 SEMS Server running on port ${config.port} (0.0.0.0)`);
  logger.info(`📍 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 API: http://localhost:${config.port}/api`);

  // Initialize DB and bootstrap auto-seeding if needed
  await initDatabase();
});

// ─── Graceful Shutdown ─────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received — starting graceful shutdown`);

  // 1. Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // 2. Disconnect Prisma (drains connection pool)
  try {
    await prisma.$disconnect();
    logger.info('Database connections closed');
  } catch (err) {
    logger.error(err, 'Error disconnecting database');
  }

  // 3. Exit
  logger.info('Graceful shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
