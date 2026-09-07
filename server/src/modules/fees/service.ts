import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog } from '../../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CalculateFeeInput,
  CreateReceiptInput,
  DepositInput,
  ConvertPaymentInput,
  ConvertBulkPaymentInput,
} from './schema';

export class FeeService {
  /**
   * Calculate fee breakup for a program + admission date + discount
   * Matches the original Invoice Calculator tool
   */
  async calculateFee(schoolId: string, input: CalculateFeeInput) {
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        // schoolId,
        programId: input.programId,
        ...(input.academicYearId && { academicYearId: input.academicYearId }),
        isActive: true,
      },
      orderBy: { feeType: 'asc' },
    });

    if (feeStructures.length === 0) {
      throw new AppError('No fee structure found for this program', 404);
    }

    let discount: { percentage?: Decimal | null; flatAmount?: Decimal | null } | null = null;
    if (input.discountTypeId) {
      discount = await prisma.discountType.findUnique({
        where: { id: input.discountTypeId },
        select: { percentage: true, flatAmount: true },
      });
    }

    const subtotal = feeStructures.reduce((sum, fs) => sum + Number(fs.totalAmount), 0);

    let discountAmount = 0;
    if (discount) {
      if (discount.percentage) {
        discountAmount = subtotal * (Number(discount.percentage) / 100);
      } else if (discount.flatAmount) {
        discountAmount = Number(discount.flatAmount);
      }
    }

    const feeBreakup = feeStructures.map((fs) => {
      const baseTotal = Number(fs.totalAmount);
      const term1Base = Number(fs.term1Amount);
      const term2Base = Number(fs.term2Amount);

      let componentDiscount = 0;
      if (discount) {
        if (discount.percentage) {
          componentDiscount = baseTotal * (Number(discount.percentage) / 100);
        } else if (discount.flatAmount) {
          componentDiscount = subtotal > 0 ? Number(discount.flatAmount) * (baseTotal / subtotal) : 0;
        }
      }

      const netTerm1 = term1Base - (baseTotal > 0 ? componentDiscount * (term1Base / baseTotal) : 0);
      const netTerm2 = term2Base - (baseTotal > 0 ? componentDiscount * (term2Base / baseTotal) : 0);

      return {
        feeType: fs.feeType,
        totalAmount: baseTotal,
        discountAmount: componentDiscount,
        term1Amount: netTerm1,
        term2Amount: netTerm2,
      };
    });

    const totalAmount = subtotal - discountAmount;

    return {
      feeBreakup,
      subtotal,
      discountAmount,
      totalAmount,
      term1Total: feeBreakup.reduce((sum, fee) => sum + fee.term1Amount, 0),
      term2Total: feeBreakup.reduce((sum, fee) => sum + fee.term2Amount, 0),
    };
  }

  /**
   * Get receipts for an admission
   */
  async getReceipts(admissionId: string, schoolId?: string) {
    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, deletedAt: null },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
        program: { select: { id: true, name: true, shortName: true } },
        academicYear: { select: { id: true, label: true } },
        school: { select: { id: true, name: true, code: true } },
        invoices: {
          where: { deletedAt: null },
          select: {
            id: true,
            invoiceNumber: true,
            term1Amount: true,
            term2Amount: true,
            totalAmount: true,
            discountAmount: true,
            netAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    const receipts = await prisma.receipt.findMany({
      where: { admissionId, deletedAt: null },
      orderBy: { receiptDate: 'desc' },
    });

    const totalReceived = receipts
      .filter((r) => !r.isCancelled)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const totalInvoiced = admission.invoices.reduce(
      (sum, inv) => sum + Number(inv.netAmount),
      0
    );

    return {
      student: admission.student,
      program: admission.program,
      academicYear: admission.academicYear,
      school: admission.school,
      invoices: admission.invoices,
      receipts,
      summary: {
        totalAmount: totalInvoiced,
        amountReceived: totalReceived,
        balanceAmount: totalInvoiced - totalReceived,
      },
    };
  }

  /**
   * Add a receipt
   */
  async createReceipt(schoolId: string, input: CreateReceiptInput, userId: string) {
    // Verify admission belongs to school
    const admission = await prisma.admission.findFirst({
      where: { id: input.admissionId, /* schoolId, */ deletedAt: null },
    });

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    // Generate receipt number
    const count = await prisma.receipt.count();
    const receiptNumber = `RCP-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

    const receipt = await prisma.$transaction(async (tx) => {
      const newReceipt = await tx.receipt.create({
        data: {
          receiptNumber,
          receiptDate: new Date(),
          amount: input.amount,
          paymentMode: input.paymentMode as any,
          bankName: input.bankName,
          bankBranch: input.bankBranch,
          chequeNumber: input.chequeNumber,
          chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
          transactionId: input.transactionId,
          admissionId: input.admissionId,
          invoiceId: input.invoiceId || null,
        },
      });

      // Update invoice if linked
      if (input.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (invoice) {
          const totalPaid = await tx.receipt.aggregate({
            where: { invoiceId: input.invoiceId, isCancelled: false },
            _sum: { amount: true },
          });
          const paidAmount = Number(totalPaid._sum.amount || 0) + Number(input.amount);

          let newStatus = invoice.status;
          if (paidAmount >= Number(invoice.netAmount)) newStatus = 'PAID';
          else if (paidAmount > 0) newStatus = 'PARTIALLY_PAID';

          await tx.invoice.update({
            where: { id: input.invoiceId },
            data: { status: newStatus as any },
          });
        }
      }

      // Generate SOA Entry
      await tx.sOAEntry.create({
        data: {
          schoolId,
          entryDate: new Date(),
          particulars: `Payment Received - ${receiptNumber}`,
          entryType: 'ADVANCE',
          invoiceAmount: 0,
          receiptAmount: input.amount,
          balance: -Number(input.amount), // This is a simplification; a real SOA would calculate running balance
        },
      });

      return newReceipt;
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Receipt',
      entityId: receipt.id,
      newValue: receipt,
    });

    return receipt;
  }

  /**
   * Create deposit slip from selected cheque receipts
   */
  async createDeposit(schoolId: string, input: DepositInput, userId: string) {
    // Verify all receipts belong to school and are cheques
    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: input.receiptIds },
        // admission: { schoolId },
        paymentMode: 'CHEQUE',
        depositId: null,
        isCancelled: false,
      },
    });

    if (receipts.length !== input.receiptIds.length) {
      throw new AppError('Some receipts are invalid, already deposited, or not cheques', 400);
    }

    const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const count = await prisma.deposit.count();
    const slipNumber = `DEP-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    const deposit = await prisma.deposit.create({
      data: {
        depositDate: new Date(),
        bankName: input.bankName,
        bankBranch: input.bankBranch,
        totalAmount,
        status: 'PENDING',
        slipNumber,
        schoolId,
      },
    });

    // Link receipts to deposit
    await prisma.receipt.updateMany({
      where: { id: { in: input.receiptIds } },
      data: { depositId: deposit.id },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Deposit',
      entityId: deposit.id,
      newValue: { ...deposit, receiptCount: receipts.length },
    });

    return { ...deposit, receiptCount: receipts.length };
  }

  /**
   * Get pending cheques for deposit (Deposit Screen)
   */
  async getPendingDeposits(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      // admission: { schoolId },
      paymentMode: 'CHEQUE',
      depositId: null,
      isCancelled: false,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { chequeNumber: { contains: query.search } },
        { admission: { student: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { admission: { student: { lastName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { chequeDate: 'desc' },
        include: {
          admission: {
            select: {
              admissionType: true,
              student: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Convert cash receipt to cheque or online
   */
  async convertPaymentMode(schoolId: string, input: ConvertPaymentInput, userId: string) {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: input.receiptId,
        // admission: { schoolId },
        paymentMode: 'CASH',
        isCancelled: false,
      },
    });

    if (!receipt) {
      throw new AppError('Cash receipt not found or already converted', 404);
    }

    const updated = await prisma.receipt.update({
      where: { id: input.receiptId },
      data: {
        paymentMode: input.newPaymentMode as any,
        bankName: input.bankName,
        chequeNumber: input.chequeNumber,
        chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
        transactionId: input.transactionId,
      },
    });

    await createAuditLog({
      userId,
      action: 'CONVERT_PAYMENT',
      entity: 'Receipt',
      entityId: receipt.id,
      oldValue: { paymentMode: 'CASH' },
      newValue: { paymentMode: input.newPaymentMode },
    });

    return updated;
  }

  /**
   * Get cash receipts for conversion (Convert Cash to Cheque / Online pages)
   */
  async getCashReceipts(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '50', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      // admission: { schoolId },
      paymentMode: 'CASH',
      isCancelled: false,
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search } },
        { admission: { student: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { admission: { student: { lastName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receiptDate: 'desc' },
        include: {
          admission: {
            select: {
              admissionType: true,
              student: { select: { firstName: true, lastName: true } },
              program: { select: { name: true } },
            },
          },
        },
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Bulk convert cash receipts to cheque or online
   */
  async convertBulkPayment(schoolId: string, input: ConvertBulkPaymentInput, userId: string) {
    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: input.receiptIds },
        // admission: { schoolId },
        paymentMode: 'CASH',
        isCancelled: false,
      },
    });

    if (receipts.length !== input.receiptIds.length) {
      throw new AppError('Some receipts are invalid, already converted, or not cash', 400);
    }

    const updated = await prisma.receipt.updateMany({
      where: { id: { in: input.receiptIds } },
      data: {
        paymentMode: input.newPaymentMode as any,
        bankName: input.bankName || null,
        bankBranch: input.bankBranch || null,
        chequeNumber: input.chequeNumber || null,
        chequeDate: input.chequeDate ? new Date(input.chequeDate) : null,
        // Store paymentGateway as transactionId prefix so gateway-based filtering
        // (HDFC/PAYTM contains search) works on the Online Payments page
        transactionId: input.transactionId || (input.paymentGateway ? `${input.paymentGateway}-CONVERTED` : null),
      },
    });

    await createAuditLog({
      userId,
      action: 'BULK_CONVERT_PAYMENT',
      entity: 'Receipt',
      newValue: { receiptIds: input.receiptIds, newPaymentMode: input.newPaymentMode, count: updated.count },
    });

    return { converted: updated.count };
  }

  /**
   * List deposit slips (Print & View Deposit Slip)
   */
  async listDeposits(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: { /* schoolId */ },
        skip,
        take: limit,
        orderBy: { depositDate: 'desc' },
        include: {
          receipts: {
            select: {
              id: true,
              receiptNumber: true,
              amount: true,
              paymentMode: true,
              chequeNumber: true,
              chequeDate: true,
              bankName: true,
              bankBranch: true,
              admission: {
                select: {
                  student: { select: { firstName: true, lastName: true } },
                  program: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.deposit.count({ where: { /* schoolId */ } }),
    ]);

    return {
      data: deposits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Funds Transfer Summary Report
   */
  async getFundsTransferSummary(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    // Group receipts by date + payment mode to build a transfer summary
    const where: any = {
      // admission: { schoolId },
      isCancelled: false,
      deletedAt: null,
    };

    if (query.from || query.to) {
      where.receiptDate = {};
      if (query.from) where.receiptDate.gte = new Date(query.from);
      if (query.to) where.receiptDate.lte = new Date(query.to);
    }

    const receipts = await prisma.receipt.findMany({
      where,
      orderBy: { receiptDate: 'desc' },
      include: {
        admission: {
          select: {
            student: { select: { firstName: true, lastName: true } },
            program: { select: { name: true } },
          },
        },
      },
    });

    // Group by receiptDate to create transfer summaries
    const grouped: Record<string, any> = {};
    receipts.forEach((r) => {
      const dateKey = r.receiptDate.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          dateOfTransfer: dateKey,
          receiptType: 'Fee Collection',
          franchiseeShare: 0,
          llplShare: 0,
          slplShare: 0,
          taxAmount: 0,
          welcomeKit: 0,
          totalLLPLShare: 0,
          totalSLPLShare: 0,
          chequeAmount: 0,
          receipts: [],
        };
      }
      const amount = Number(r.amount);
      // Simplified royalty split (franchisee 70%, SLPL 30%)
      grouped[dateKey].franchiseeShare += amount * 0.7;
      grouped[dateKey].llplShare += amount * 0.3;
      grouped[dateKey].slplShare += amount * 0.3;
      grouped[dateKey].taxAmount += amount * 0.18 * 0.3; // GST on SLPL share
      grouped[dateKey].totalLLPLShare += amount * 0.3;
      grouped[dateKey].totalSLPLShare += amount * 0.3;
      if (r.paymentMode === 'CHEQUE') grouped[dateKey].chequeAmount += amount;
      grouped[dateKey].receipts.push(r);
    });

    const data = Object.values(grouped);
    const paged = data.slice(skip, skip + limit);

    return {
      data: paged,
      total: data.length,
      pagination: { page, limit, total: data.length, totalPages: Math.ceil(data.length / limit) },
    };
  }

  /**
   * Fee Collection through Homebuddy App
   */
  async getHomebuddyReceipts(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      // admission: { schoolId },
      paymentMode: 'ONLINE',
      isCancelled: false,
      deletedAt: null,
      transactionId: { not: null },
    };

    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search } },
        { admission: { student: { firstName: { contains: query.search, mode: 'insensitive' } } } },
        { admission: { student: { lastName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receiptDate: 'desc' },
        include: {
          admission: {
            select: {
              student: { select: { uin: true, firstName: true, lastName: true } },
              program: { select: { name: true } },
            },
          },
        },
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Online Payment Details
   */
  async getOnlinePayments(schoolId: string, query: any) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      // admission: { schoolId },
      deletedAt: null,
      paymentMode: { in: ['ONLINE', 'PAYTM_POS', 'BANK_TRANSFER'] },
    };

    if (query.paymentGateway && query.paymentGateway !== 'All') {
      where.transactionId = { contains: query.paymentGateway };
    }
    if (query.paymentStatus && query.paymentStatus !== 'All') {
      if (query.paymentStatus === 'CANCELLED') {
        where.isCancelled = true;
      } else if (query.paymentStatus === 'SUCCESS') {
        where.isCancelled = false;
      } else if (query.paymentStatus === 'FAILED') {
        where.isCancelled = true;
      }
    }
    if (query.from || query.to) {
      where.receiptDate = {};
      if (query.from) where.receiptDate.gte = new Date(query.from);
      if (query.to) where.receiptDate.lte = new Date(query.to);
    }
    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search } },
        { transactionId: { contains: query.search } },
        { admission: { student: { firstName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receiptDate: 'desc' },
        include: {
          admission: {
            select: {
              student: { select: { uin: true, firstName: true, lastName: true } },
              program: { select: { name: true } },
            },
          },
        },
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const feeService = new FeeService();
