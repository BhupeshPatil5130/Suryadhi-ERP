import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().optional(),
  items: z.any().optional(), // Can be JSON array of items or structured metadata object
  totalAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]),
  notes: z.string().optional(),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED',
    'ORDER_RECEIVED',
    'IN_PROCESS',
    'ORDER_DISPATCH',
    'IN_TRANSIT',
    'ORDER_DELIVERED',
  ]).optional(),
  orderType: z.string().optional(),
  program: z.string().optional(),
  supplier: z.string().optional(),
  transporter: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  noOfBoxes: z.union([z.number(), z.string().transform((v) => parseInt(v, 10) || 1)]).optional(),
  depositReceiptNo: z.string().optional(),
  depositAmount: z.union([z.number(), z.string().transform((v) => parseFloat(v) || 0)]).optional(),
  paymentMode: z.string().optional(),
  paymentRef: z.string().optional(),
  bankName: z.string().optional(),
  depositDate: z.string().optional(),
  lineItems: z.array(z.any()).optional(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

export const reportShortageDamageSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reportType: z.enum(['SHORTAGE', 'DAMAGE']),
  description: z.string().optional(),
  reportDate: z.string(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;
export type ReportShortageDamageInput = z.infer<typeof reportShortageDamageSchema>;
