import { z } from 'zod';

export const calculateFeeSchema = z.object({
  programId: z.string().min(1, 'Program is required'),
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
  discountTypeId: z.string().optional(),
  academicYearId: z.string().optional(),
});

export const createReceiptSchema = z.object({
  admissionId: z.string().min(1, 'Admission ID is required'),
  invoiceId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'ONLINE', 'PAYTM_POS', 'BANK_TRANSFER']),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
  receiptDate: z.string().optional(),
  notes: z.string().optional(),
});

export const depositSchema = z.object({
  receiptIds: z.array(z.string()).min(1, 'At least one receipt is required'),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
});

export const convertPaymentSchema = z.object({
  receiptId: z.string().min(1, 'Receipt ID is required'),
  newPaymentMode: z.enum(['CHEQUE', 'ONLINE']),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
  receiptAmount: z.number().optional(),
});

export const convertBulkPaymentSchema = z.object({
  receiptIds: z.array(z.string()).min(1, 'At least one receipt is required'),
  newPaymentMode: z.enum(['CHEQUE', 'ONLINE']),
  paymentGateway: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.string().optional(),
  transactionId: z.string().optional(),
});

export type CalculateFeeInput = z.infer<typeof calculateFeeSchema>;
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type ConvertPaymentInput = z.infer<typeof convertPaymentSchema>;
export type ConvertBulkPaymentInput = z.infer<typeof convertBulkPaymentSchema>;
