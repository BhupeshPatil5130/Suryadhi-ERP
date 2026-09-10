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
      async create({ args, query }) {
        return withRetry(() => query(args));
      },
      async update({ args, query }) {
        return withRetry(() => query(args));
      },
      async delete({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          // @ts-ignore
          const modelName = model.charAt(0).toLowerCase() + model.slice(1);
          // @ts-ignore
          return withRetry(() => basePrisma[modelName].update({
            ...args,
            data: { deletedAt: new Date() },
          }));
        }
        return withRetry(() => query(args));
      },
      async deleteMany({ model, args, query }) {
        if (modelsWithSoftDelete.includes(model)) {
          // @ts-ignore
          const modelName = model.charAt(0).toLowerCase() + model.slice(1);
          // @ts-ignore
          return withRetry(() => basePrisma[modelName].updateMany({
            ...args,
            data: { deletedAt: new Date() },
          }));
        }
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
