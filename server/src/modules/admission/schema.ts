import { z } from 'zod';

export const createAdmissionSchema = z.object({
  // Student info
  studentFirstName: z.string().min(1, 'Student first name is required').max(100),
  studentMiddleName: z.string().max(100).optional().or(z.literal('')),
  studentLastName: z.string().min(1, 'Student last name is required').max(100),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
  gender: z.enum(['BOY', 'GIRL']),
  nationality: z.string().max(100).optional().default('Indian'),

  // Admission info
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
  programId: z.string().min(1, 'Program is required'),
  batchId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year is required'),
  admissionType: z.enum(['ONLINE', 'OFFLINE']).default('OFFLINE'),

  // Flags
  isUniformRequired: z.boolean().default(false),
  isDiscountApplicable: z.boolean().default(false),
  isTransportRequired: z.boolean().default(false),
  isPreviousSchooling: z.boolean().default(false),
  isKinAttended: z.boolean().default(false),
  hasSibling: z.boolean().default(false),
  discountTypeId: z.string().optional(),

  // Parent info
  fatherName: z.string().max(200).optional(),
  motherName: z.string().max(200).optional(),
  fatherMobile: z.string().max(15).optional(),
  motherMobile: z.string().max(15).optional(),
  fatherEmail: z.string().email().optional().or(z.literal('')),
  motherEmail: z.string().email().optional().or(z.literal('')),
  fatherOccupation: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  fatherOrganisation: z.string().max(200).optional(),
  motherOrganisation: z.string().max(200).optional(),

  // Address
  address: z.string().min(1, 'Address is required').max(500),
  postalCode: z.string().min(1, 'Postal code is required').max(10),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional().default('India'),

  // From enquiry (optional)
  enquiryId: z.string().optional(),
}).refine(
  (data) => data.fatherName || data.motherName,
  { message: 'At least one parent name is required', path: ['fatherName'] }
).refine(
  (data) => data.fatherMobile || data.motherMobile,
  { message: 'At least one parent mobile is required', path: ['fatherMobile'] }
);

export const updateAdmissionSchema = z.object({
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
  gender: z.enum(['BOY', 'GIRL']).optional(),
  nationality: z.string().max(100).optional(),
  programId: z.string().optional(),
  batchId: z.string().optional(),
  admissionType: z.enum(['ONLINE', 'OFFLINE']).optional(),
  isUniformRequired: z.boolean().optional(),
  isDiscountApplicable: z.boolean().optional(),
  isTransportRequired: z.boolean().optional(),
  isPreviousSchooling: z.boolean().optional(),
  isKinAttended: z.boolean().optional(),
  hasSibling: z.boolean().optional(),
  discountTypeId: z.string().nullable().optional(),

  // Parent updates
  fatherName: z.string().max(200).optional(),
  motherName: z.string().max(200).optional(),
  fatherMobile: z.string().max(15).optional(),
  motherMobile: z.string().max(15).optional(),
  fatherEmail: z.string().email().optional().or(z.literal('')),
  motherEmail: z.string().email().optional().or(z.literal('')),
  fatherOccupation: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  fatherOrganisation: z.string().max(200).optional(),
  motherOrganisation: z.string().max(200).optional(),

  // Address updates
  address: z.string().max(500).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const quitAdmissionSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
  isDuplicate: z.boolean().default(false),
  quitDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
});

export const transferOutSchema = z.object({
  toSchoolName: z.string().min(1, 'Destination school is required').max(300),
  reason: z.string().max(500).optional(),
  transferDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
});

export const graduateSchema = z.object({
  toProgramId: z.string().min(1, 'Target program is required'),
  graduationDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required'),
  isHomebuddy: z.boolean().default(false),
});

export const nameChangeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date required').optional(),
});

export const admissionListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('25'),
  status: z.string().optional(),
  programId: z.string().optional(),
  batchId: z.string().optional(),
  search: z.string().optional(),
  admissionType: z.string().optional(),
  sortBy: z.string().optional().default('admissionDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>;
export type UpdateAdmissionInput = z.infer<typeof updateAdmissionSchema>;
export type QuitAdmissionInput = z.infer<typeof quitAdmissionSchema>;
export type TransferOutInput = z.infer<typeof transferOutSchema>;
export type GraduateInput = z.infer<typeof graduateSchema>;
export type NameChangeInput = z.infer<typeof nameChangeSchema>;
export type AdmissionListQuery = z.infer<typeof admissionListQuerySchema>;
