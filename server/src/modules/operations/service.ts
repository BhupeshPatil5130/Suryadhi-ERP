import prisma from '../../config/database';
import { OrderStatus } from '@prisma/client';
import { getNextSequenceNumber } from '../../utils/helpers';
import { 
  CreatePurchaseOrderInput, 
  UpdatePurchaseOrderStatusInput, 
  ReportShortageDamageInput 
} from './schema';

export class OperationsService {
  async getPurchaseOrders(schoolId: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });

    // If no purchase orders exist yet for this school, seed default initial franchise POs
    if (orders.length === 0) {
      const defaultPOs = [
        {
          orderNumber: 'PO-2026-001',
          totalAmount: 125000,
          status: OrderStatus.DELIVERED,
          notes: 'Delivered in good condition',
          items: {
            orderType: 'Welcome Kit (WK) Order',
            program: 'Euro Junior',
            supplier: 'Suryadhi Central Supply HQ',
            transporter: 'Blue Dart / LR-519315',
            estimatedDeliveryDate: '2026-06-08',
            deliveryDate: '2026-06-08',
            noOfBoxes: 12,
            depositReceiptNo: 'DEP-2026-0038',
            depositAmount: 125000,
            paymentMode: 'Online Transfer / NEFT',
            paymentRef: 'UTR-SBIN26178921',
            bankName: 'State Bank of India - Dhule Branch',
            depositDate: '2026-06-05',
            lineItems: [
              { id: '1', itemName: 'Student Welcome Kit Box (Student Bag, Stationery, Badges)', category: 'Kit', qty: 50, unitPrice: 2200, total: 110000 },
              { id: '2', itemName: 'Student Academic Diary & ID Card Lanyard Set', category: 'Kit', qty: 50, unitPrice: 300, total: 15000 },
            ],
          },
        },
        {
          orderNumber: 'PO-2026-002',
          totalAmount: 30000,
          status: OrderStatus.DISPATCHED,
          notes: 'Dispatched on 09-06-2026 via DTDC',
          items: {
            orderType: 'Admission Form Order',
            program: 'Play Group',
            supplier: 'Suryadhi Central Supply HQ',
            transporter: 'DTDC Express / LR-884210',
            estimatedDeliveryDate: '2026-06-12',
            deliveryDate: '—',
            noOfBoxes: 4,
            depositReceiptNo: 'DEP-2026-0042',
            depositAmount: 30000,
            paymentMode: 'Cheque / DD',
            paymentRef: 'CHQ-882190',
            bankName: 'HDFC Bank - Deopur Branch',
            depositDate: '2026-06-08',
            lineItems: [
              { id: '1', itemName: 'Official Student Enrollment & Admission Booklet (Pack of 50)', category: 'Form', qty: 10, unitPrice: 1500, total: 15000 },
              { id: '2', itemName: 'Parent Welcome Brochure & Handbook Set', category: 'Form', qty: 125, unitPrice: 120, total: 15000 },
            ],
          },
        },
        {
          orderNumber: 'PO-2026-003',
          totalAmount: 60000,
          status: OrderStatus.SUBMITTED,
          notes: 'Awaiting HO dispatch clearance',
          items: {
            orderType: 'Uniform & Bag Batch PO',
            program: 'Nursery',
            supplier: 'Suryadhi Garments Division',
            transporter: 'TCI Freight / LR-104921',
            estimatedDeliveryDate: '2026-06-15',
            deliveryDate: '—',
            noOfBoxes: 6,
            depositReceiptNo: 'DEP-2026-0046',
            depositAmount: 60000,
            paymentMode: 'Online Transfer / NEFT',
            paymentRef: 'UTR-HDFC0019284',
            bankName: 'HDFC Bank - Deopur Branch',
            depositDate: '2026-06-10',
            lineItems: [
              { id: '1', itemName: 'Summer School Uniform Pair (Shirt + Trousers/Skirts)', category: 'Uniform', qty: 30, unitPrice: 1250, total: 37500 },
              { id: '2', itemName: 'School Backpack & Water Bottle Set', category: 'Accessories', qty: 30, unitPrice: 750, total: 22500 },
            ],
          },
        },
        {
          orderNumber: 'PO-2026-004',
          totalAmount: 85000,
          status: OrderStatus.DISPATCHED,
          notes: 'Winter coats and sweaters batch',
          items: {
            orderType: 'Winter Wear PO',
            program: 'Euro Senior',
            supplier: 'Suryadhi Garments Division',
            transporter: 'Trackon Logistics / LR-771890',
            estimatedDeliveryDate: '2026-06-18',
            deliveryDate: '—',
            noOfBoxes: 8,
            depositReceiptNo: 'DEP-2026-0051',
            depositAmount: 85000,
            paymentMode: 'Online Transfer / NEFT',
            paymentRef: 'UTR-SBIN26881920',
            bankName: 'State Bank of India - Dhule Branch',
            depositDate: '2026-06-11',
            lineItems: [
              { id: '1', itemName: 'Branded Winter Fleece Jacket & Woolen Cap Set', category: 'Winter', qty: 35, unitPrice: 1400, total: 49000 },
              { id: '2', itemName: 'Full Sleeve School Cardigan Sweater', category: 'Winter', qty: 38, unitPrice: 950, total: 36000 },
            ],
          },
        },
        {
          orderNumber: 'PO-2026-005',
          totalAmount: 48000,
          status: OrderStatus.APPROVED,
          notes: 'Play area toys & gym mats batch',
          items: {
            orderType: 'Classroom & Sports Equipment PO',
            program: 'All Programs',
            supplier: 'Sports & Play Equipment Co',
            transporter: 'VRL Logistics / LR-992341',
            estimatedDeliveryDate: '2026-06-20',
            deliveryDate: '—',
            noOfBoxes: 5,
            depositReceiptNo: 'DEP-2026-0055',
            depositAmount: 48000,
            paymentMode: 'Cash to Bank Deposit',
            paymentRef: 'DEP-CASH-77192',
            bankName: 'State Bank of India - Dhule Branch',
            depositDate: '2026-06-12',
            lineItems: [
              { id: '1', itemName: 'Indoor Soft Gym Activity Play Mats (Pack of 6)', category: 'Equipment', qty: 6, unitPrice: 4500, total: 27000 },
              { id: '2', itemName: 'Montessori Sensory Wooden Learning Toys Kit', category: 'Learning', qty: 3, unitPrice: 7000, total: 21000 },
            ],
          },
        },
      ];

      try {
        await prisma.purchaseOrder.createMany({
          data: defaultPOs.map((d) => ({
            schoolId,
            orderNumber: d.orderNumber,
            totalAmount: d.totalAmount,
            status: d.status,
            notes: d.notes,
            items: d.items,
            orderedAt: new Date(),
          })),
          skipDuplicates: true,
        });

        return prisma.purchaseOrder.findMany({
          where: { schoolId },
          orderBy: { createdAt: 'desc' },
        });
      } catch (_e) {
        return orders;
      }
    }

    return orders;
  }

  async getPurchaseOrderById(id: string, schoolId: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        schoolId,
      },
    });
    if (!order) {
      throw new Error('Purchase order not found');
    }
    return order;
  }

  async createPurchaseOrder(schoolId: string, data: CreatePurchaseOrderInput) {
    const orderNumber = data.orderNumber || (await getNextSequenceNumber('PO', schoolId, prisma, 5));

    let itemsPayload: any = data.items;
    if (!itemsPayload || Array.isArray(itemsPayload)) {
      itemsPayload = {
        orderType: data.orderType || 'Welcome Kit (WK) Order',
        program: data.program || 'Play Group',
        supplier: data.supplier || 'Suryadhi Central Supply HQ',
        transporter: data.transporter || 'Blue Dart Logistics',
        estimatedDeliveryDate:
          data.estimatedDeliveryDate ||
          new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        noOfBoxes: data.noOfBoxes || 4,
        depositReceiptNo: data.depositReceiptNo || `DEP-2026-${Math.floor(Math.random() * 900) + 100}`,
        depositAmount: data.depositAmount || data.totalAmount,
        paymentMode: data.paymentMode || 'Online Transfer / NEFT',
        paymentRef: data.paymentRef || 'UTR-CONFIRMED',
        bankName: data.bankName || 'State Bank of India - Dhule Branch',
        depositDate: data.depositDate || new Date().toISOString().split('T')[0],
        remarks: data.notes || '',
        lineItems: Array.isArray(data.items) ? data.items : data.lineItems || [],
      };
    }

    let statusEnum: OrderStatus = OrderStatus.SUBMITTED;
    if (data.status) {
      const s = data.status.toUpperCase();
      if (s === 'DRAFT') statusEnum = OrderStatus.DRAFT;
      else if (s === 'APPROVED' || s === 'IN_PROCESS') statusEnum = OrderStatus.APPROVED;
      else if (s === 'DISPATCHED' || s === 'ORDER_DISPATCH' || s === 'IN_TRANSIT') statusEnum = OrderStatus.DISPATCHED;
      else if (s === 'DELIVERED' || s === 'ORDER_DELIVERED') statusEnum = OrderStatus.DELIVERED;
      else if (s === 'CANCELLED') statusEnum = OrderStatus.CANCELLED;
      else statusEnum = OrderStatus.SUBMITTED;
    }

    return prisma.purchaseOrder.create({
      data: {
        schoolId,
        orderNumber,
        items: itemsPayload,
        totalAmount: data.totalAmount,
        notes: data.notes || itemsPayload.remarks || '',
        status: statusEnum,
        orderedAt: new Date(),
      },
    });
  }

  async updatePurchaseOrderStatus(id: string, schoolId: string, data: UpdatePurchaseOrderStatusInput) {
    let statusEnum: OrderStatus = OrderStatus.SUBMITTED;
    const s = data.status.toUpperCase();
    if (s === 'DRAFT') statusEnum = OrderStatus.DRAFT;
    else if (s === 'APPROVED' || s === 'IN_PROCESS') statusEnum = OrderStatus.APPROVED;
    else if (s === 'DISPATCHED' || s === 'ORDER_DISPATCH' || s === 'IN_TRANSIT') statusEnum = OrderStatus.DISPATCHED;
    else if (s === 'DELIVERED' || s === 'ORDER_DELIVERED') statusEnum = OrderStatus.DELIVERED;
    else if (s === 'CANCELLED') statusEnum = OrderStatus.CANCELLED;

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: statusEnum,
        ...(statusEnum === OrderStatus.SUBMITTED || statusEnum === OrderStatus.DISPATCHED ? { orderedAt: new Date() } : {}),
        ...(statusEnum === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  async deletePurchaseOrder(id: string, schoolId: string) {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id, schoolId },
    });
    if (!order) {
      throw new Error('Purchase order not found');
    }
    return prisma.purchaseOrder.delete({
      where: { id },
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
    const orderNumber = await getNextSequenceNumber('EXC', schoolId, prisma, 3);
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
