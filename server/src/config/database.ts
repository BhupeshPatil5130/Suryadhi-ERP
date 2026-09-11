import { PrismaClient } from '@prisma/client';
import { config } from './index';

// Auto-derive DIRECT_URL for Neon PostgreSQL if not explicitly set
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace('-pooler.', '.');
}

const basePrisma = new PrismaClient({
  log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
});

const modelsWithSoftDelete = ['User', 'Student', 'Parent', 'Enquiry', 'Admission', 'Invoice', 'Receipt'];

// Helper to retry queries if Neon database is resuming from auto-suspend
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isConnError =
      error?.message?.includes("Can't reach database server") ||
      error?.message?.includes("PrismaClientInitializationError") ||
      error?.code === 'P1001' ||
      error?.code === 'P1002';

    if (isConnError && retries > 0) {
      console.warn(`[Prisma] Database connection waking up... Retrying query (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return withRetry(() => query(args));
      },
      async findFirst({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return withRetry(() => query(args));
      },
      async findUnique({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          let injectedDeletedAt = false;
          const anyArgs = args as any;
          if (anyArgs.select && anyArgs.select.deletedAt === undefined) {
            anyArgs.select = { ...anyArgs.select, deletedAt: true };
            injectedDeletedAt = true;
          }
          const result: any = await withRetry(() => query(args));
          if (result && result.deletedAt !== null && result.deletedAt !== undefined) {
            return null;
          }
          if (result && injectedDeletedAt) {
            delete result.deletedAt;
          }
          return result;
        }
        return withRetry(() => query(args));
      },
      async findUniqueOrThrow({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          let injectedDeletedAt = false;
          const anyArgs = args as any;
          if (anyArgs.select && anyArgs.select.deletedAt === undefined) {
            anyArgs.select = { ...anyArgs.select, deletedAt: true };
            injectedDeletedAt = true;
          }
          const result: any = await withRetry(() => query(args));
          if (result && result.deletedAt !== null && result.deletedAt !== undefined) {
            throw new Error(`Record not found in ${model}`);
          }
          if (result && injectedDeletedAt) {
            delete result.deletedAt;
          }
          return result;
        }
        return withRetry(() => query(args));
      },
      async create({ args, query }) {
        return withRetry(() => query(args));
      },
      async update({ args, query }) {
        return withRetry(() => query(args));
      },
      async delete({ args, query }) {
        return withRetry(() => query(args));
      },
      async deleteMany({ args, query }) {
        return withRetry(() => query(args));
      },
    },
  },
}) as unknown as PrismaClient; // Cast to avoid deep type issues across the app

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

if (config.isDev) {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
  }
}

export default prisma;
