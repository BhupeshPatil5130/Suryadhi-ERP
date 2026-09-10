import { z } from 'zod';

export const createEnquirySchema = z.object({
  enquirerMobile: z.string().min(10, 'Valid mobile number required').max(15),
  enquirerName: z.string().min(1, 'Enquirer name is required').max(200),
  enquirerEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  enquirerAddress: z.string().min(1, 'Address is required').max(500),
  studentFirstName: z.string().min(1, 'Student first name is required').max(100),
  studentMiddleName: z.string().max(100).optional().or(z.literal('')),
  studentLastName: z.string().min(1, 'Student last name is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
  gender: z.enum(['BOY', 'GIRL']),
  programId: z.string().min(1, 'Program is required'),
  hasSibling: z.boolean().default(false),
  isTrialClass: z.boolean().default(false),
  mediaSourceId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

export const updateEnquirySchema = createEnquirySchema.partial().extend({
  stage: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'TRIAL_CLASS', 'CONVERTED', 'LOST']).optional(),
  subStage: z.string().optional(),
});

export const enquiryFollowUpSchema = z.object({
  contactDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
  nextFollowUp: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
  followUpDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  comment: z.string().max(1000).optional(),
  stage: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'TRIAL_CLASS', 'CONVERTED', 'LOST']).optional(),
  subStage: z.string().optional(),
  stageReason: z.string().optional(),
  contactedBy: z.string().optional(),
});

export const enquiryListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('25'),
  cursor: z.string().optional(),
  stage: z.string().optional(),
  subStage: z.string().optional(),
  search: z.string().optional(),
  programId: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
export type EnquiryFollowUpInput = z.infer<typeof enquiryFollowUpSchema>;
export type EnquiryListQuery = z.infer<typeof enquiryListQuerySchema>;

export const advanceReceiptSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'ONLINE', 'PAYTM_POS', 'BANK_TRANSFER']),
  bankName: z.string().max(200).optional(),
  chequeNumber: z.string().max(50).optional(),
  chequeDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
  notes: z.string().max(500).optional(),
  receiptDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
});

export type AdvanceReceiptInput = z.infer<typeof advanceReceiptSchema>;
