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
 * Generate a sequential ID with prefix (e.g., INV-2024-0001)
 */
export async function generateSequentialId(
  prefix: string,
  entity: string,
  schoolId?: string
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;

  // Find the last entry for this year
  const lastEntry = await prisma.auditLog.findFirst({
    where: {
      entity,
      action: 'CREATE',
      newValue: {
        path: ['sequenceKey'],
        equals: key,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const sequence = lastEntry ? 
    parseInt((lastEntry.newValue as any)?.sequence || '0', 10) + 1 : 1;
  
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${key}-${paddedSequence}`;
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


/**
 * Normalize legacy batch timeSlot labels to standard 'Morning Shift' / 'Evening Shift'
 */
export function normalizeTimeSlot(slot: string | null | undefined): string {
  if (!slot) return 'N/A';
  const lower = slot.toLowerCase();
  if (
    lower.includes('evening') ||
    lower.includes('late') ||
    lower.includes('afternoon') ||
    lower.includes('12') ||
    lower.includes('1:') ||
    lower.includes('2:') ||
    lower.includes('3:')
  ) {
    return 'Evening Shift';
  }
  return 'Morning Shift';
}
