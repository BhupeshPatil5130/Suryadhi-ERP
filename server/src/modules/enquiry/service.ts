import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog, getNextSequenceNumber } from '../../utils/helpers';
import {
  CreateEnquiryInput,
  UpdateEnquiryInput,
  EnquiryFollowUpInput,
  EnquiryListQuery,
  AdvanceReceiptInput,
} from './schema';

export class EnquiryService {
  /**
   * List enquiries with filtering, sorting, and pagination
   */
  async list(schoolId: string, query: EnquiryListQuery) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      deletedAt: null,
    };

    if (query.stage) {
      where.stage = query.stage;
    }
    if (query.subStage) {
      where.subStage = query.subStage;
    }
    if (query.programId) {
      where.programId = query.programId;
    }
    if (query.search) {
      where.OR = [
        { enquirerName: { contains: query.search, mode: 'insensitive' } },
        { enquirerMobile: { contains: query.search } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        include: {
          student: true,
          program: true,
          academicYear: true,
          mediaSource: true,
          followUps: {
            orderBy: { contactDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enquiry.count({ where }),
    ]);

    return {
      data: enquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get an enquiry by ID with related records
   */
  async getById(id: string, schoolId: string) {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        student: true,
        program: true,
        academicYear: true,
        mediaSource: true,
        followUps: {
          orderBy: { contactDate: 'desc' },
        },
        advanceReceipts: {
          orderBy: { receiptDate: 'desc' },
        },
      },
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    return enquiry;
  }

  /**
   * Create a new enquiry with student record inside a transaction
   */
  async create(schoolId: string, input: CreateEnquiryInput, userId: string) {
    const enquiry = await prisma.$transaction(async (tx) => {
      // Create student record
      const student = await tx.student.create({
        data: {
          firstName: input.studentFirstName,
          middleName: input.studentMiddleName || null,
          lastName: input.studentLastName,
          dateOfBirth: new Date(input.dateOfBirth),
          gender: input.gender as any,
        },
      });

      // Create enquiry record linked to student
      return await tx.enquiry.create({
        data: {
          enquirerName: input.enquirerName,
          enquirerMobile: input.enquirerMobile,
          enquirerEmail: input.enquirerEmail || null,
          enquirerAddress: input.enquirerAddress,
          hasSibling: input.hasSibling,
          isTrialClass: input.isTrialClass,
          stage: 'NEW',
          studentId: student.id,
          programId: input.programId,
          academicYearId: input.academicYearId,
          mediaSourceId: input.mediaSourceId || null,
          schoolId,
        },
        include: {
          student: true,
          program: true,
        },
      });
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Enquiry',
      entityId: enquiry.id,
      newValue: enquiry,
    });

    return enquiry;
  }

  /**
   * Update an existing enquiry
   */
  async update(id: string, schoolId: string, input: UpdateEnquiryInput, userId: string) {
    const existing = await this.getById(id, schoolId);

    const updateData: any = {};
    if (input.enquirerName) updateData.enquirerName = input.enquirerName;
    if (input.enquirerMobile) updateData.enquirerMobile = input.enquirerMobile;
    if (input.enquirerEmail !== undefined) updateData.enquirerEmail = input.enquirerEmail || null;
    if (input.enquirerAddress) updateData.enquirerAddress = input.enquirerAddress;
    if (input.hasSibling !== undefined) updateData.hasSibling = input.hasSibling;
    if (input.isTrialClass !== undefined) updateData.isTrialClass = input.isTrialClass;
    if (input.stage) updateData.stage = input.stage;
    if (input.subStage !== undefined) updateData.subStage = input.subStage;
    if (input.programId) updateData.programId = input.programId;
    if (input.mediaSourceId !== undefined) updateData.mediaSourceId = input.mediaSourceId || null;

    // Update student info if provided
    if (input.studentFirstName || input.studentLastName || input.dateOfBirth || input.gender) {
      const studentUpdate: any = {};
      if (input.studentFirstName) studentUpdate.firstName = input.studentFirstName;
      if (input.studentMiddleName !== undefined) studentUpdate.middleName = input.studentMiddleName || null;
      if (input.studentLastName) studentUpdate.lastName = input.studentLastName;
      if (input.dateOfBirth) studentUpdate.dateOfBirth = new Date(input.dateOfBirth);
      if (input.gender) studentUpdate.gender = input.gender;

      await prisma.student.update({
        where: { id: existing.studentId },
        data: studentUpdate,
      });
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: updateData,
      include: {
        student: true,
        program: true,
      },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Enquiry',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  /**
   * Add a follow-up entry to an enquiry
   */
  async addFollowUp(enquiryId: string, schoolId: string, input: any, userId: string) {
    // Verify enquiry exists
    await this.getById(enquiryId, schoolId);

    const contactDate = input.contactDate ? new Date(input.contactDate) : new Date();
    const nextDate = input.nextFollowUp || input.followUpDate;
    const nextFollowUp = nextDate ? new Date(nextDate) : null;
    const notes = input.notes || input.comment || '';
    const newStage = input.stage || 'FOLLOW_UP';

    const followUp = await prisma.enquiryFollowUp.create({
      data: {
        enquiryId,
        contactDate,
        nextFollowUp,
        notes,
        contactedBy: input.contactedBy || userId,
      },
    });

    // Update enquiry's follow-up tracking
    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        lastContacted: contactDate,
        nextFollowUp,
        stage: newStage as any,
        subStage: input.subStage || undefined,
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'EnquiryFollowUp',
      entityId: followUp.id,
      newValue: followUp,
    });

    return followUp;
  }

  /**
   * Convert enquiry to admission (marks as CONVERTED)
   */
  async convertToAdmission(enquiryId: string, schoolId: string, userId: string) {
    const enquiry = await this.getById(enquiryId, schoolId);

    if (enquiry.stage === 'CONVERTED') {
      throw new AppError('Enquiry is already converted to admission', 400);
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: {
        stage: 'CONVERTED',
      },
      include: { student: true },
    });

    await createAuditLog({
      userId,
      action: 'CONVERT',
      entity: 'Enquiry',
      entityId: enquiryId,
      oldValue: { stage: enquiry.stage },
      newValue: { stage: 'CONVERTED' },
    });

    return updated;
  }

  /**
   * Delete enquiry (soft delete)
   */
  async delete(id: string, schoolId: string, userId: string) {
    const enquiry = await this.getById(id, schoolId);

    const deleted = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Enquiry',
      entityId: id,
      oldValue: enquiry,
    });

    return deleted;
  }

  /**
   * Create an advance receipt for an enquiry
   */
  async createAdvanceReceipt(enquiryId: string, schoolId: string, input: AdvanceReceiptInput, userId: string) {
    // Verify enquiry exists and belongs to school
    await this.getById(enquiryId, schoolId);

    const receipt = await prisma.$transaction(async (tx) => {
      // Generate receipt number atomically
      const receiptNumber = await getNextSequenceNumber('ADV', schoolId, tx, 6);

      const created = await tx.advanceReceipt.create({
        data: {
          enquiryId,
          amount: input.amount,
          paymentMode: input.paymentMode as any,
          receiptNumber,
          receiptDate: input.receiptDate ? new Date(input.receiptDate) : new Date(),
          bankName: input.bankName || null,
          chequeNumber: input.chequeNumber || null,
          chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
          notes: input.notes || null,
        },
      });

      return created;
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'AdvanceReceipt',
      entityId: receipt.id,
      newValue: receipt,
    });

    return receipt;
  }

  /**
   * Get all advance receipts for an enquiry
   */
  async getAdvanceReceipts(enquiryId: string, schoolId: string) {
    // Verify enquiry exists and belongs to school
    await this.getById(enquiryId, schoolId);

    const receipts = await prisma.advanceReceipt.findMany({
      where: { enquiryId },
      orderBy: { receiptDate: 'desc' },
    });

    return receipts;
  }
}

export const enquiryService = new EnquiryService();
