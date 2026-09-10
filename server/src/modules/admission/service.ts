import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/helpers';
import {
  CreateAdmissionInput,
  UpdateAdmissionInput,
  QuitAdmissionInput,
  TransferOutInput,
  GraduateInput,
  NameChangeInput,
  AdmissionListQuery,
} from './schema';

export class AdmissionService {
  /**
   * List admissions with filtering and pagination
   */
  async list(schoolId: string, query: AdmissionListQuery) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.programId) where.programId = query.programId;
    if (query.batchId) where.batchId = query.batchId;
    if (query.admissionType) where.admissionType = query.admissionType;
    if (query.search) {
      where.OR = [
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { student: { uin: { contains: query.search, mode: 'insensitive' } } },
        { student: { parent: { fatherName: { contains: query.search, mode: 'insensitive' } } } },
        { student: { parent: { fatherMobile: { contains: query.search } } } },
        { student: { parent: { motherMobile: { contains: query.search } } } },
      ];
    }

    const orderBy: any = {};
    orderBy[query.sortBy || 'admissionDate'] = query.sortOrder || 'desc';

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          student: {
            include: {
              parent: {
                select: {
                  fatherName: true,
                  motherName: true,
                  fatherMobile: true,
                  motherMobile: true,
                },
              },
            },
          },
          program: { select: { id: true, name: true, shortName: true } },
          batch: { select: { id: true, timeSlot: true } },
          discountType: { select: { id: true, name: true } },
        },
      }),
      prisma.admission.count({ where }),
    ]);

    return {
      data: admissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Get single admission with all related data
   */
  async getById(id: string, schoolId: string) {
    const admission = await prisma.admission.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        student: {
          include: { parent: true },
        },
        program: true,
        batch: true,
        academicYear: true,
        discountType: true,
        invoices: { orderBy: { createdAt: 'desc' } },
        receipts: { orderBy: { receiptDate: 'desc' } },
        graduations: { orderBy: { graduationDate: 'desc' } },
        quitRecord: true,
        transferOutRequest: true,
        forecastedRoyalties: { orderBy: { month: 'asc' } },
        school: { select: { name: true } },
      },
    });

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    return admission;
  }

  /**
   * Create new admission with student and parent records
   */
  async create(schoolId: string, input: CreateAdmissionInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      // Create parent record
      const parent = await tx.parent.create({
        data: {
          fatherName: input.fatherName,
          motherName: input.motherName,
          fatherMobile: input.fatherMobile,
          motherMobile: input.motherMobile,
          fatherEmail: input.fatherEmail || null,
          motherEmail: input.motherEmail || null,
          fatherOccupation: input.fatherOccupation,
          motherOccupation: input.motherOccupation,
          fatherOrganisation: input.fatherOrganisation,
          motherOrganisation: input.motherOrganisation,
        },
      });

      // Fetch school and academic year for UIN generation
      const school = await tx.school.findUnique({ where: { id: schoolId } });
      const academicYear = await tx.academicYear.findUnique({ where: { id: input.academicYearId } });
      const count = await tx.admission.count({ where: { schoolId, academicYearId: input.academicYearId } });

      const ayStart = academicYear?.startDate.getFullYear().toString().slice(-2) || '24';
      const ayEnd = academicYear?.endDate.getFullYear().toString().slice(-2) || '25';
      const aySuffix = `${ayStart}${ayEnd}`;
      
      const newUin = `SNK/${school?.code || '3201'}/${(count + 1).toString().padStart(4, '0')}/${aySuffix}`;

      // Create or update student record
      let student;
      if (input.enquiryId) {
        // If coming from enquiry, find existing student
        const enquiry = await tx.enquiry.findUnique({
          where: { id: input.enquiryId },
          select: { studentId: true },
        });
        if (enquiry) {
          student = await tx.student.update({
            where: { id: enquiry.studentId },
            data: {
              nationality: input.nationality,
              address: input.address,
              postalCode: input.postalCode,
              city: input.city,
              state: input.state,
              country: input.country,
              parentId: parent.id,
              uin: newUin, // Ensure UIN is set when converted
            },
          });
        }
      }

      if (!student) {
        student = await tx.student.create({
          data: {
            firstName: input.studentFirstName,
            middleName: input.studentMiddleName || null,
            lastName: input.studentLastName,
            dateOfBirth: new Date(input.dateOfBirth),
            gender: input.gender as any,
            nationality: input.nationality,
            uin: newUin,
            address: input.address,
            postalCode: input.postalCode,
            city: input.city,
            state: input.state,
            country: input.country,
            parentId: parent.id,
          },
        });
      }

      // Create admission
      const admission = await tx.admission.create({
        data: {
          admissionDate: new Date(input.admissionDate),
          admissionType: input.admissionType as any,
          isUniformRequired: input.isUniformRequired,
          isDiscountApplicable: input.isDiscountApplicable,
          isTransportRequired: input.isTransportRequired,
          isPreviousSchooling: input.isPreviousSchooling,
          isKinAttended: input.isKinAttended,
          hasSibling: input.hasSibling,
          studentId: student.id,
          programId: input.programId,
          batchId: input.batchId || null,
          academicYearId: input.academicYearId,
          schoolId,
          discountTypeId: input.discountTypeId || null,
        },
        include: {
          student: { include: { parent: true } },
          program: true,
          batch: true,
        },
      });

      // Update enquiry if converted
      if (input.enquiryId) {
        await tx.enquiry.update({
          where: { id: input.enquiryId },
          data: {
            stage: 'CONVERTED',
            convertedToAdmissionId: admission.id,
          },
        });
      }

      // Automatically Generate Invoice and SOA based on Fee Structure
      const feeStructures = await tx.feeStructure.findMany({
        where: {
          schoolId,
          programId: input.programId,
          academicYearId: input.academicYearId,
          isActive: true,
        },
      });

      if (feeStructures.length > 0) {
        let discount = null;
        if (input.discountTypeId) {
          discount = await tx.discountType.findUnique({
            where: { id: input.discountTypeId },
          });
        }

        let term1Amount = 0;
        let term2Amount = 0;
        let totalAmount = 0;

        feeStructures.forEach((fs) => {
          term1Amount += Number(fs.term1Amount);
          term2Amount += Number(fs.term2Amount);
          totalAmount += Number(fs.totalAmount);
        });

        let discountAmount = 0;
        if (discount && input.isDiscountApplicable) {
          if (discount.percentage) {
            discountAmount = totalAmount * (Number(discount.percentage) / 100);
          } else if (discount.flatAmount) {
            discountAmount = Number(discount.flatAmount);
          }
        }

        const netAmount = totalAmount - discountAmount;

        // Create Invoice
        const invoiceCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            admissionId: admission.id,
            term1Amount,
            term2Amount,
            totalAmount,
            discountAmount,
            netAmount,
            status: 'GENERATED',
          },
        });

        // Adjust enquiry advance receipts: carry them over as admission receipts
        if (input.enquiryId) {
          const advanceReceipts = await tx.advanceReceipt.findMany({
            where: { enquiryId: input.enquiryId },
          });

          let totalAdvancePaid = 0;
          for (const ar of advanceReceipts) {
            const arReceiptCount = await tx.receipt.count();
            const arReceiptNumber = `REC-${new Date().getFullYear()}-${(arReceiptCount + 1).toString().padStart(6, '0')}`;

            await tx.receipt.create({
              data: {
                receiptNumber: arReceiptNumber,
                receiptDate: ar.receiptDate,
                amount: ar.amount,
                paymentMode: ar.paymentMode,
                bankName: ar.bankName,
                chequeNumber: ar.chequeNumber,
                chequeDate: ar.chequeDate,
                admissionId: admission.id,
                invoiceId: invoice.id,
              },
            });

            totalAdvancePaid += Number(ar.amount);
          }

          // Update invoice status based on advance payments
          if (totalAdvancePaid >= netAmount) {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: 'PAID' },
            });
          } else if (totalAdvancePaid > 0) {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: 'PARTIALLY_PAID' },
            });
          }
        }

        // Create SOA Entry for Franchisee Fees (Debit Invoice)
        await tx.sOAEntry.create({
          data: {
            schoolId,
            entryDate: new Date(),
            particulars: `Term Fees Invoice - ${student.firstName} ${student.lastName}`,
            entryType: 'FRANCHISEE_FEES',
            invoiceAmount: netAmount,
            receiptAmount: 0,
            balance: netAmount,
          },
        });
      }

      await createAuditLog({
        userId,
        action: 'CREATE',
        entity: 'Admission',
        entityId: admission.id,
        newValue: admission,
      });

      return admission;
    });
  }

  /**
   * Update admission details
   */
  async update(id: string, schoolId: string, input: UpdateAdmissionInput, userId: string) {
    const existing = await this.getById(id, schoolId);

    return prisma.$transaction(async (tx) => {
      // Update parent info if provided
      if (existing.student.parentId) {
        const parentUpdate: any = {};
        if (input.fatherName !== undefined) parentUpdate.fatherName = input.fatherName;
        if (input.motherName !== undefined) parentUpdate.motherName = input.motherName;
        if (input.fatherMobile !== undefined) parentUpdate.fatherMobile = input.fatherMobile;
        if (input.motherMobile !== undefined) parentUpdate.motherMobile = input.motherMobile;
        if (input.fatherEmail !== undefined) parentUpdate.fatherEmail = input.fatherEmail || null;
        if (input.motherEmail !== undefined) parentUpdate.motherEmail = input.motherEmail || null;
        if (input.fatherOccupation !== undefined) parentUpdate.fatherOccupation = input.fatherOccupation;
        if (input.motherOccupation !== undefined) parentUpdate.motherOccupation = input.motherOccupation;
        if (input.fatherOrganisation !== undefined) parentUpdate.fatherOrganisation = input.fatherOrganisation;
        if (input.motherOrganisation !== undefined) parentUpdate.motherOrganisation = input.motherOrganisation;

        if (Object.keys(parentUpdate).length > 0) {
          await tx.parent.update({
            where: { id: existing.student.parentId },
            data: parentUpdate,
          });
        }
      }

      // Update student address if provided
      const studentUpdate: any = {};
      if (input.address !== undefined) studentUpdate.address = input.address;
      if (input.postalCode !== undefined) studentUpdate.postalCode = input.postalCode;
      if (input.city !== undefined) studentUpdate.city = input.city;
      if (input.state !== undefined) studentUpdate.state = input.state;
      if (input.country !== undefined) studentUpdate.country = input.country;
      if (input.gender !== undefined) studentUpdate.gender = input.gender;

      if (Object.keys(studentUpdate).length > 0) {
        await tx.student.update({
          where: { id: existing.studentId },
          data: studentUpdate,
        });
      }

      // Update admission
      const admissionUpdate: any = {};
      if (input.programId !== undefined) admissionUpdate.programId = input.programId;
      if (input.batchId !== undefined) admissionUpdate.batchId = input.batchId;
      if (input.admissionType !== undefined) admissionUpdate.admissionType = input.admissionType;
      if (input.isUniformRequired !== undefined) admissionUpdate.isUniformRequired = input.isUniformRequired;
      if (input.isDiscountApplicable !== undefined) admissionUpdate.isDiscountApplicable = input.isDiscountApplicable;
      if (input.isTransportRequired !== undefined) admissionUpdate.isTransportRequired = input.isTransportRequired;
      if (input.isPreviousSchooling !== undefined) admissionUpdate.isPreviousSchooling = input.isPreviousSchooling;
      if (input.isKinAttended !== undefined) admissionUpdate.isKinAttended = input.isKinAttended;
      if (input.hasSibling !== undefined) admissionUpdate.hasSibling = input.hasSibling;
      if (input.discountTypeId !== undefined) admissionUpdate.discountTypeId = input.discountTypeId;
      if ((input as any).admissionDate !== undefined) admissionUpdate.admissionDate = new Date((input as any).admissionDate);

      const updated = await tx.admission.update({
        where: { id },
        data: admissionUpdate,
        include: {
          student: { include: { parent: true } },
          program: true,
          batch: true,
        },
      });

      // ── Invoice Regeneration ──────────────────────────────────
      // If programId or admissionDate changed, cancel old invoices and regenerate
      const programChanged = input.programId !== undefined && input.programId !== existing.programId;
      const dateChanged = (input as any).admissionDate !== undefined;

      if (programChanged || dateChanged) {
        // Soft-cancel existing invoices that are not yet paid
        const existingInvoices = await tx.invoice.findMany({
          where: { admissionId: id, deletedAt: null },
        });

        for (const inv of existingInvoices) {
          // Only cancel GENERATED invoices, not ones with payments
          const paidReceipts = await tx.receipt.count({
            where: { invoiceId: inv.id, isCancelled: false },
          });
          if (paidReceipts === 0) {
            await tx.invoice.update({
              where: { id: inv.id },
              data: { status: 'CANCELLED', deletedAt: new Date() },
            });
          }
        }

        // Regenerate invoice from current fee structure
        const effectiveProgramId = input.programId || existing.programId;
        const feeStructures = await tx.feeStructure.findMany({
          where: {
            schoolId,
            programId: effectiveProgramId,
            academicYearId: existing.academicYearId,
            isActive: true,
          },
        });

        if (feeStructures.length > 0) {
          const effectiveDiscountTypeId = input.discountTypeId !== undefined
            ? input.discountTypeId
            : existing.discountTypeId;

          let discount = null;
          if (effectiveDiscountTypeId) {
            discount = await tx.discountType.findUnique({
              where: { id: effectiveDiscountTypeId },
            });
          }

          let term1Amount = 0;
          let term2Amount = 0;
          let totalAmount = 0;

          feeStructures.forEach((fs) => {
            term1Amount += Number(fs.term1Amount);
            term2Amount += Number(fs.term2Amount);
            totalAmount += Number(fs.totalAmount);
          });

          const isDiscountApplicable = input.isDiscountApplicable !== undefined
            ? input.isDiscountApplicable
            : existing.isDiscountApplicable;

          let discountAmount = 0;
          if (discount && isDiscountApplicable) {
            if (discount.percentage) {
              discountAmount = totalAmount * (Number(discount.percentage) / 100);
            } else if (discount.flatAmount) {
              discountAmount = Number(discount.flatAmount);
            }
          }

          const netAmount = totalAmount - discountAmount;

          const invoiceCount = await tx.invoice.count();
          const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;

          await tx.invoice.create({
            data: {
              invoiceNumber,
              admissionId: id,
              term1Amount,
              term2Amount,
              totalAmount,
              discountAmount,
              netAmount,
              status: 'GENERATED',
            },
          });

          // Create SOA Entry for updated invoice
          await tx.sOAEntry.create({
            data: {
              schoolId,
              entryDate: new Date(),
              particulars: `Updated Term Fees Invoice - ${existing.student.firstName} ${existing.student.lastName}`,
              entryType: 'FRANCHISEE_FEES',
              invoiceAmount: netAmount,
              receiptAmount: 0,
              balance: netAmount,
            },
          });
        }
      }

      await createAuditLog({
        userId,
        action: 'UPDATE',
        entity: 'Admission',
        entityId: id,
        oldValue: existing,
        newValue: updated,
      });

      return updated;
    });
  }

  /**
   * Graduate student to next program
   */
  async graduate(id: string, schoolId: string, input: GraduateInput, userId: string) {
    const admission = await this.getById(id, schoolId);

    if (admission.status !== 'ACTIVE') {
      throw new AppError('Only active admissions can be graduated', 400);
    }

    return prisma.$transaction(async (tx) => {
      // Create graduation record
      const graduation = await tx.graduation.create({
        data: {
          admissionId: id,
          fromProgramId: admission.programId,
          toProgramId: input.toProgramId,
          graduationDate: new Date(input.graduationDate),
          isHomebuddy: input.isHomebuddy,
        },
      });

      // Update admission
      await tx.admission.update({
        where: { id },
        data: {
          status: 'GRADUATED',
          programId: input.toProgramId,
        },
      });

      await createAuditLog({
        userId,
        action: 'GRADUATE',
        entity: 'Admission',
        entityId: id,
        newValue: graduation,
      });

      return graduation;
    });
  }

  /**
   * Quit admission
   */
  async quit(id: string, schoolId: string, input: QuitAdmissionInput, userId: string) {
    const admission = await this.getById(id, schoolId);

    if (admission.status !== 'ACTIVE') {
      throw new AppError('Only active admissions can be quit', 400);
    }

    return prisma.$transaction(async (tx) => {
      const quitRecord = await tx.quitRecord.create({
        data: {
          admissionId: id,
          reason: input.reason,
          quitDate: input.quitDate ? new Date(input.quitDate) : new Date(),
          isDuplicate: input.isDuplicate,
        },
      });

      await tx.admission.update({
        where: { id },
        data: { status: 'QUIT' },
      });

      await createAuditLog({
        userId,
        action: 'QUIT',
        entity: 'Admission',
        entityId: id,
        newValue: quitRecord,
      });

      return quitRecord;
    });
  }

  /**
   * Transfer out to another school
   */
  async transferOut(id: string, schoolId: string, input: TransferOutInput, userId: string) {
    const admission = await this.getById(id, schoolId);

    if (admission.status !== 'ACTIVE') {
      throw new AppError('Only active admissions can be transferred', 400);
    }

    return prisma.$transaction(async (tx) => {
      const transfer = await tx.transferOutRequest.create({
        data: {
          admissionId: id,
          fromSchoolName: admission.school?.name || 'Current School',
          toSchoolName: input.toSchoolName,
          reason: input.reason,
          transferDate: new Date(input.transferDate),
          status: 'REQUESTED',
        },
      });

      await tx.admission.update({
        where: { id },
        data: { status: 'TRANSFERRED_OUT' },
      });

      await createAuditLog({
        userId,
        action: 'TRANSFER_OUT',
        entity: 'Admission',
        entityId: id,
        newValue: transfer,
      });

      return transfer;
    });
  }

  /**
   * Change student name/DOB
   */
  async changeName(id: string, schoolId: string, input: NameChangeInput, userId: string) {
    const admission = await this.getById(id, schoolId);

    const updateData: any = {};
    if (input.firstName) updateData.firstName = input.firstName;
    if (input.middleName !== undefined) updateData.middleName = input.middleName || null;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.dateOfBirth) updateData.dateOfBirth = new Date(input.dateOfBirth);

    const updated = await prisma.student.update({
      where: { id: admission.studentId },
      data: updateData,
    });

    await createAuditLog({
      userId,
      action: 'NAME_CHANGE',
      entity: 'Student',
      entityId: admission.studentId,
      oldValue: {
        firstName: admission.student.firstName,
        lastName: admission.student.lastName,
        dateOfBirth: admission.student.dateOfBirth,
      },
      newValue: updateData,
    });

    return updated;
  }
}

export const admissionService = new AdmissionService();
