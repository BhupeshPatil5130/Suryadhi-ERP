import prisma from '../config/database';

interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : undefined,
        newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break business operations
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Cursor-based pagination helper for Prisma
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  total?: number;
}

export function parsePaginationParams(query: any): PaginationParams {
  return {
    cursor: query.cursor as string | undefined,
    limit: Math.min(parseInt(query.limit || '25', 10), 100),
    direction: (query.direction as 'forward' | 'backward') || 'forward',
  };
}

/**
 * Safely rounds monetary amounts to 2 decimal places to prevent floating point precision drift.
 */
export function roundCurrency(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Atomically generates the next sequence value (integer) using the SequenceCounter table.
 * Thread-safe and race-condition free even under high concurrent load.
 */
export async function getNextSequenceValue(
  prefix: string,
  schoolId?: string,
  client?: any
): Promise<number> {
  const db = client || prisma;
  const year = new Date().getFullYear();
  const normalizedSchoolId = schoolId || 'GLOBAL';

  const counter = await db.sequenceCounter.upsert({
    where: {
      prefix_year_schoolId: {
        prefix,
        year,
        schoolId: normalizedSchoolId,
      },
    },
    update: {
      currentVal: { increment: 1 },
    },
    create: {
      prefix,
      year,
      schoolId: normalizedSchoolId,
      currentVal: 1,
    },
  });

  return counter.currentVal;
}

/**
 * Atomically generates the next formatted sequential ID using the SequenceCounter table.
 * Format: {prefix}-{year}-{paddedNumber}
 */
export async function getNextSequenceNumber(
  prefix: string,
  schoolId?: string,
  client?: any,
  digits: number = 6
): Promise<string> {
  const year = new Date().getFullYear();
  const val = await getNextSequenceValue(prefix, schoolId, client);
  const paddedNumber = val.toString().padStart(digits, '0');
  return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Generate a sequential ID with prefix (e.g., INV-2024-0001)
 */
export async function generateSequentialId(
  prefix: string,
  _entity?: string,
  schoolId?: string
): Promise<string> {
  return getNextSequenceNumber(prefix, schoolId, prisma, 4);
}

/**
 * Safely extracts the effective schoolId for database scoping.
 * - SUPER_ADMIN: Can query across all schools (returns query/body schoolId if provided, or undefined).
 * - Franchise roles: Strictly bound to req.user.schoolId.
 */
export function getEffectiveSchoolId(req: any): string | undefined {
  if (!req.user) return undefined;
  if (req.user.role === 'SUPER_ADMIN') {
    return (req.query?.schoolId as string) || (req.body?.schoolId as string) || req.user.schoolId || undefined;
  }
  return req.user.schoolId || undefined;
}

