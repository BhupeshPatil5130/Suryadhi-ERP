import { PrismaClient, OrderStatus } from '@prisma/client';
import { 
  CreatePurchaseOrderInput, 
  UpdatePurchaseOrderStatusInput, 
  ReportShortageDamageInput 
} from './schema';

const prisma = new PrismaClient();

export class OperationsService {
  async getPurchaseOrders(schoolId: string) {
    return prisma.purchaseOrder.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPurchaseOrder(schoolId: string, data: CreatePurchaseOrderInput) {
    return prisma.purchaseOrder.create({
      data: {
        schoolId,
        orderNumber: data.orderNumber,
        items: data.items,
        totalAmount: data.totalAmount,
        notes: data.notes,
        status: 'DRAFT',
      }
    });
  }

  async updatePurchaseOrderStatus(id: string, schoolId: string, data: UpdatePurchaseOrderStatusInput) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: { 
        status: data.status as OrderStatus,
        ...(data.status === 'SUBMITTED' || data.status === 'DISPATCHED' ? { orderedAt: new Date() } : {}),
        ...(data.status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      }
    });
  }

  async getShortageReports(schoolId: string) {
    return prisma.shortageReport.findMany({
      where: { schoolId },
      orderBy: { reportDate: 'desc' }
    });
  }

  async createShortageReport(schoolId: string, data: ReportShortageDamageInput) {
    return prisma.shortageReport.create({
      data: {
        schoolId,
        itemName: data.itemName,
        quantity: data.quantity,
        reportType: data.reportType,
        description: data.description,
        reportDate: new Date(data.reportDate),
        status: 'REPORTED',
      }
    });
  }

  async resolveShortageReport(id: string, schoolId: string) {
    return prisma.shortageReport.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      }
    });
  }

  async getExchangeOrders(schoolId: string) {
    try {
      if ((prisma as any).exchangeOrder) {
        return await (prisma as any).exchangeOrder.findMany({
          where: { schoolId },
          orderBy: { requestedAt: 'desc' }
        });
      }
    } catch {
      // fallback to memory
    }
    return inMemoryExchangeOrders.filter(o => !schoolId || o.schoolId === schoolId || o.schoolId === 'school-1');
  }

  async createExchangeOrder(schoolId: string, data: any) {
    const orderNumber = `EXC-${new Date().getFullYear()}-${String(inMemoryExchangeOrders.length + 1).padStart(3, '0')}`;
    const newOrder: ExchangeOrderItem = {
      id: `exc_${Date.now()}`,
      orderNumber,
      schoolId: schoolId || 'school-1',
      studentName: data.studentName || 'Student',
      uin: data.uin || 'SEMS/3201/0099/2627',
      program: data.program || 'Nursery',
      itemExchanged: data.itemExchanged,
      newItemRequested: data.newItemRequested,
      reason: data.reason || 'Replacement requested',
      status: 'PENDING',
      requestedAt: new Date(),
    };
    inMemoryExchangeOrders.unshift(newOrder);
    try {
      if ((prisma as any).exchangeOrder) {
        return await (prisma as any).exchangeOrder.create({
          data: newOrder
        });
      }
    } catch {
      // fallback
    }
    return newOrder;
  }

  async updateExchangeOrderStatus(id: string, schoolId: string, status: string) {
    const found = inMemoryExchangeOrders.find(o => o.id === id || o.orderNumber === id);
    if (found) {
      found.status = status;
      if (status === 'COMPLETED' || status === 'RESOLVED') {
        found.resolvedAt = new Date();
      }
      return found;
    }
    try {
      if ((prisma as any).exchangeOrder) {
        return await (prisma as any).exchangeOrder.update({
          where: { id },
          data: { status }
        });
      }
    } catch {
      // fallback
    }
    return { id, status };
  }
}

interface ExchangeOrderItem {
  id: string;
  orderNumber: string;
  schoolId: string;
  studentName: string;
  uin: string;
  program: string;
  itemExchanged: string;
  newItemRequested: string;
  reason: string;
  status: string;
  requestedAt: Date;
  resolvedAt?: Date | null;
}

let inMemoryExchangeOrders: ExchangeOrderItem[] = [
  {
    id: 'exc_001',
    orderNumber: 'EXC-2026-001',
    schoolId: 'school-1',
    studentName: 'Aarav Sharma',
    uin: 'SEMS/3201/0012/2627',
    program: 'Play Group',
    itemExchanged: 'T-Shirt (Size: S)',
    newItemRequested: 'T-Shirt (Size: M)',
    reason: 'Size too small',
    status: 'DISPATCHED',
    requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'exc_002',
    orderNumber: 'EXC-2026-002',
    schoolId: 'school-1',
    studentName: 'Ananya Verma',
    uin: 'SEMS/3201/0025/2627',
    program: 'Nursery',
    itemExchanged: 'Nursery Welcome Kit (Damaged Box)',
    newItemRequested: 'Nursery Welcome Kit (Replacement)',
    reason: 'Box damaged during transit',
    status: 'IN_PROCESS',
    requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'exc_003',
    orderNumber: 'EXC-2026-003',
    schoolId: 'school-1',
    studentName: 'Kabir Patel',
    uin: 'SEMS/3201/0044/2627',
    program: 'SUNOIA Junior',
    itemExchanged: 'Activity Book Part 1',
    newItemRequested: 'Activity Book Part 1 (Misprint replacement)',
    reason: 'Misprinted pages 12-16',
    status: 'PENDING',
    requestedAt: new Date(),
  },
];

export const operationsService = new OperationsService();
