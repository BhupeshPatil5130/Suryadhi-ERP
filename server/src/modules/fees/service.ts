import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createAuditLog, getNextSequenceNumber, roundCurrency } from '../../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import {
  CalculateFeeInput,
  CreateReceiptInput,
  DepositInput,
  ConvertPaymentInput,
  ConvertBulkPaymentInput,
} from './schema';

export function formatInvoiceNumber(inv?: string | null): string {
  if (!inv || inv === 'Not Generated' || inv === 'N/A') return 'SNK/3201/0001/2026';
  const str = inv.trim().replace(/^INV[-_/]/i, '');
  const parts = str.split('/');
  if (parts.length >= 4) {
    const schoolDigits = parts[1].replace(/[^0-9]/g, '');
    const schoolCode = schoolDigits ? schoolDigits.slice(-4).padStart(4, '0') : '3201';
    const seqDigits = parts[2].replace(/[^0-9]/g, '');
    const seq = seqDigits ? seqDigits.slice(-4).padStart(4, '0') : '0001';
    let year = parts[3].replace(/[^0-9]/g, '');
    if (year.length === 4 && (year.startsWith('26') || year === '2627')) year = '2026';
    else if (year.length === 4 && year.startsWith('24')) year = '2024';
    else if (year.length === 4 && year.startsWith('25')) year = '2025';
    else if (year.length === 2) year = `20${year}`;
    else if (!year) year = '2026';
    return `SNK/${schoolCode}/${seq}/${year}`;
  }
  const allNums = str.replace(/[^0-9]/g, '');
  const seq = allNums ? allNums.slice(-4).padStart(4, '0') : '0001';
  return `SNK/3201/${seq}/2026`;
}

export class FeeService {
  /**
   * Calculate fee breakup for a program + admission date + discount
   * Matches the original Invoice Calculator tool
   */
  async calculateFee(schoolId: string, input: CalculateFeeInput) {
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        schoolId,
        programId: input.programId,
        isActive: true,
      },
      orderBy: { feeType: 'asc' },
    });

    if (feeStructures.length === 0) {
      throw new AppError('No active fee structure found for this program', 404);
    }

    const subtotal = feeStructures.reduce(
      (sum, fs) => sum + Number(fs.totalAmount),
      0
    );

    let discount: any = null;
    let discountAmount = 0;

    if (input.discountTypeId) {
      discount = await prisma.discountType.findUnique({
        where: { id: input.discountTypeId },
      });

      if (discount) {
        if (discount.percentage) {
          discountAmount = (subtotal * Number(discount.percentage)) / 100;
        } else if (discount.flatAmount) {
          discountAmount = Number(discount.flatAmount);
        }
      }
    }

    const feeBreakup = feeStructures.map((fs) => {
      const baseTotal = Number(fs.totalAmount);
      const term1Base = Number(fs.term1Amount);
      const term2Base = Number(fs.term2Amount);

      let componentDiscount = 0;
      if (discount) {
        if (discount.percentage) {
          componentDiscount = roundCurrency(baseTotal * (Number(discount.percentage) / 100));
        } else if (discount.flatAmount) {
          componentDiscount = subtotal > 0 ? roundCurrency(Number(discount.flatAmount) * (baseTotal / subtotal)) : 0;
        }
      }

      const netTerm1 = roundCurrency(term1Base - (baseTotal > 0 ? componentDiscount * (term1Base / baseTotal) : 0));
      const netTerm2 = roundCurrency(term2Base - (baseTotal > 0 ? componentDiscount * (term2Base / baseTotal) : 0));

      return {
        feeType: fs.feeType,
        totalAmount: baseTotal,
        discountAmount: componentDiscount,
        term1Amount: netTerm1,
        term2Amount: netTerm2,
      };
    });

    const totalAmount = roundCurrency(subtotal - discountAmount);

    return {
      feeBreakup,
      subtotal: roundCurrency(subtotal),
      discountAmount: roundCurrency(discountAmount),
      totalAmount,
      term1Total: roundCurrency(feeBreakup.reduce((sum, fee) => sum + fee.term1Amount, 0)),
      term2Total: roundCurrency(feeBreakup.reduce((sum, fee) => sum + fee.term2Amount, 0)),
    };
  }

  /**
   * Get receipts for an admission
   */
  async getReceipts(admissionId: string, schoolId?: string) {
    const where: any = { id: admissionId, deletedAt: null };
    if (schoolId) {
      where.schoolId = schoolId;
    }
    const admission = await prisma.admission.findFirst({
      where,
      include: {
        student: {
          include: {
            parent: true,
          },
        },
        program: { select: { id: true, name: true, shortName: true } },
        batch: { select: { id: true, timeSlot: true } },
        academicYear: { select: { id: true, label: true } },
        school: { select: { id: true, name: true, code: true, address: true, city: true, phone: true } },
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

    // Ensure invoice number matches student UIN format (e.g. SNK/3201/0007/2026)
    const formattedInvoices = admission.invoices.map((inv) => {
      const uin = admission.student?.uin;
      let invoiceNumber = inv.invoiceNumber;
      if (uin && (!invoiceNumber || invoiceNumber.startsWith('INV-') || !invoiceNumber.includes(uin))) {
        invoiceNumber = uin;
      }
      invoiceNumber = formatInvoiceNumber(invoiceNumber || uin);
      return {
        ...inv,
        invoiceNumber,
      };
    });

    // Separate Invoice (Term) receipts from Other / Independent receipts
    // Only receipts linked to the invoice count towards invoice payment
    // Independent / Other receipts (admission form fee, uniform, transport, etc.) do NOT reduce invoice balance
    const invoiceReceipts = receipts.filter((r) => !r.isCancelled && r.invoiceId !== null);
    const otherReceipts = receipts.filter((r) => !r.isCancelled && r.invoiceId === null);

    const term1Total = admission.invoices.reduce((sum, inv) => sum + Number(inv.term1Amount), 0);
    const term2Total = admission.invoices.reduce((sum, inv) => sum + Number(inv.term2Amount), 0);
    const totalInvoiced = admission.invoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0);

    // Calculate Term 1 vs Term 2 collections
    let term1Received = 0;
    let term2Received = 0;

    invoiceReceipts.forEach((r) => {
      const amt = Number(r.amount);
      const branchNote = (r.bankBranch || '').toLowerCase();
      if (branchNote.includes('term 2') || branchNote.includes('term2')) {
        term2Received += amt;
      } else if (branchNote.includes('term 1') || branchNote.includes('term1')) {
        term1Received += amt;
      } else {
        // Automatically allocate to Term 1 until filled, then overflow to Term 2
        if (term1Received < term1Total) {
          const needed = term1Total - term1Received;
          if (amt <= needed) {
            term1Received += amt;
          } else {
            term1Received += needed;
            term2Received += (amt - needed);
          }
        } else {
          term2Received += amt;
        }
      }
    });

    const totalReceived = term1Received + term2Received;
    const otherTotalReceived = otherReceipts.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      student: admission.student,
      program: admission.program,
      batch: admission.batch?.timeSlot || 'Morning Shift',
      academicYear: admission.academicYear,
      school: admission.school,
      invoices: formattedInvoices,
      receipts,
      invoiceReceipts,
      otherReceipts,
      summary: {
        term1Amount: term1Total,
        term1Received,
        term1Balance: Math.max(0, term1Total - term1Received),
        term2Amount: term2Total,
        term2Received,
        term2Balance: Math.max(0, term2Total - term2Received),
        totalAmount: totalInvoiced,
        amountReceived: totalReceived,
        balanceAmount: totalInvoiced - totalReceived,
        otherTotalReceived,
      },
    };
  }

  async getReceiptById(receiptId: string, schoolId?: string) {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        deletedAt: null,
        ...(schoolId ? { admission: { schoolId } } : {}),
      },
      include: {
        admission: {
          include: {
            student: {
              include: {
                parent: true,
              },
            },
            program: true,
            batch: true,
            academicYear: true,
            school: true,
          },
        },
        invoice: true,
      },
    });

    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    if (receipt.invoice) {
      (receipt.invoice as any).invoiceNumber = formatInvoiceNumber(
        receipt.invoice.invoiceNumber || receipt.admission?.student?.uin
      );
    }

    return receipt;
  }

  /**
   * Delete a receipt (soft-delete) and recalculate invoice status
   */
  async deleteReceipt(receiptId: string, schoolId?: string, userId?: string) {
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        deletedAt: null,
        ...(schoolId ? { admission: { schoolId } } : {}),
      },
      include: {
        admission: true,
      },
    });

    if (!receipt) {
      throw new AppError('Receipt not found or already deleted', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const deleted = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          deletedAt: new Date(),
          isCancelled: true,
          cancelledAt: new Date(),
          cancelReason: 'Deleted by user',
        },
      });

      if (receipt.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: receipt.invoiceId } });
        if (invoice) {
          const totalPaid = await tx.receipt.aggregate({
            where: {
              invoiceId: receipt.invoiceId,
              isCancelled: false,
              deletedAt: null,
            },
            _sum: { amount: true },
          });
          const paidAmount = Number(totalPaid._sum.amount || 0);

          let newStatus: any = 'GENERATED';
          if (paidAmount >= Number(invoice.netAmount)) {
            newStatus = 'PAID';
          } else if (paidAmount > 0) {
            newStatus = 'PARTIALLY_PAID';
          }

          await tx.invoice.update({
            where: { id: receipt.invoiceId },
            data: { status: newStatus },
          });
        }
      }

      return deleted;
    });

    if (userId) {
      await createAuditLog({
        userId,
        action: 'DELETE',
        entity: 'Receipt',
        entityId: receipt.id,
        oldValue: receipt,
      });
    }

    return updated;
  }

  /**
   * Add a receipt
   */
  async createReceipt(schoolId: string, input: CreateReceiptInput, userId: string) {
    // Verify admission strictly belongs to the school (prevents IDOR)
    const admission = await prisma.admission.findFirst({
      where: { id: input.admissionId, schoolId, deletedAt: null },
    });

    if (!admission) {
      throw new AppError('Admission not found or access denied for this school', 404);
    }

    const receipt = await prisma.$transaction(async (tx) => {
      // Atomically generate receipt number inside transaction
      const receiptNumber = await getNextSequenceNumber('RCP', schoolId, tx, 6);

      const newReceipt = await tx.receipt.create({
        data: {
          receiptNumber,
          receiptDate: input.receiptDate ? new Date(input.receiptDate) : new Date(),
          amount: input.amount,
          paymentMode: input.paymentMode as any,
          bankName: input.bankName,
          bankBranch: input.bankBranch || input.notes || (input as any).term || null,
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

      // Compute accurate running balance from previous SOA ledger entry
      const lastSoa = await tx.sOAEntry.findFirst({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        select: { balance: true },
      });
      const previousBalance = lastSoa?.balance ? Number(lastSoa.balance) : 0;
      const newRunningBalance = previousBalance - Number(input.amount);

      // Generate SOA Entry
      await tx.sOAEntry.create({
        data: {
          schoolId,
          entryDate: new Date(),
          particulars: `Payment Received - ${receiptNumber}`,
          entryType: 'ADVANCE',
          invoiceAmount: 0,
          receiptAmount: input.amount,
          balance: newRunningBalance,
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
    const result = await prisma.$transaction(async (tx) => {
      // Verify all receipts belong to school and are cheques
      const receipts = await tx.receipt.findMany({
        where: {
          id: { in: input.receiptIds },
          admission: { schoolId },
          paymentMode: 'CHEQUE',
          depositId: null,
          isCancelled: false,
        },
      });

      if (receipts.length !== input.receiptIds.length) {
        throw new AppError('Some receipts are invalid, already deposited, or not cheques', 400);
      }

      const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount), 0);
      const slipNumber = await getNextSequenceNumber('DEP', schoolId, tx, 5);

      const deposit = await tx.deposit.create({
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
      await tx.receipt.updateMany({
        where: { id: { in: input.receiptIds } },
        data: { depositId: deposit.id },
      });

      return { deposit, receiptCount: receipts.length };
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Deposit',
      entityId: result.deposit.id,
      newValue: { ...result.deposit, receiptCount: result.receiptCount },
    });

    return { ...result.deposit, receiptCount: result.receiptCount };
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

    if (query.month) {
      // Month could be "YYYY-MM" (e.g. "2026-04") or "MM" (e.g. "04")
      if (typeof query.month === 'string' && query.month.includes('-')) {
        const [yearStr, monthStr] = query.month.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        where.receiptDate = { gte: startDate, lte: endDate };
      } else {
        const monthNum = parseInt(query.month, 10) - 1;
        if (!isNaN(monthNum)) {
          const currentYear = new Date().getFullYear();
          const startDate = new Date(Date.UTC(currentYear, monthNum, 1));
          const endDate = new Date(Date.UTC(currentYear, monthNum + 1, 0, 23, 59, 59, 999));
          where.receiptDate = { gte: startDate, lte: endDate };
        }
      }
    }

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
