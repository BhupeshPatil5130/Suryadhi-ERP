import prisma from '../../config/database';

export class ReportsService {
  async getAdmissionsReport(schoolId: string, filters: any) {
    const { academicYearId, programId, status, from, to } = filters;
    const where: any = { schoolId, deletedAt: null };
    if (academicYearId) where.academicYearId = academicYearId;
    if (programId) where.programId = programId;
    if (status) where.status = status;
    if (from || to) {
      where.admissionDate = {};
      if (from) where.admissionDate.gte = new Date(from);
      if (to) where.admissionDate.lte = new Date(to);
    }

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        student: { include: { parent: true } },
        program: true,
        batch: true,
        academicYear: true,
        discountType: true,
      },
      orderBy: { admissionDate: 'desc' },
    });
    return { data: admissions, total: admissions.length };
  }

  async getEnquiriesReport(schoolId: string, filters: any) {
    const { academicYearId, programId, stage, from, to } = filters;
    const where: any = { schoolId, deletedAt: null };
    if (academicYearId) where.academicYearId = academicYearId;
    if (programId) where.programId = programId;
    if (stage) where.stage = stage;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      include: {
        student: { include: { parent: true } },
        program: true,
        mediaSource: true,
        academicYear: true,
        followUps: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: enquiries, total: enquiries.length };
  }

  async getPaymentDueReport(schoolId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { admission: { schoolId }, deletedAt: null },
      include: {
        admission: { include: { student: true, program: true } },
        receipts: { where: { isCancelled: false } },
      },
    });

    const dueData = invoices
      .map((inv: any) => {
        const totalPaid = inv.receipts.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
        const balance = Number(inv.netAmount) - totalPaid;
        return {
          student: inv.admission.student,
          program: inv.admission.program,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: Number(inv.netAmount),
          totalPaid,
          balance,
        };
      })
      .filter((d: any) => d.balance > 0);

    return { data: dueData, total: dueData.length };
  }

  async getCancelledReceipts(schoolId: string) {
    const receipts = await prisma.receipt.findMany({
      where: { isCancelled: true, admission: { schoolId } },
      include: {
        admission: { include: { student: true, program: true } },
        deposit: true,
      },
      orderBy: { receiptDate: 'desc' },
    });
    return { data: receipts, total: receipts.length };
  }

  async getTransfersReport(schoolId: string, filters: any) {
    const { from, to } = filters;
    const where: any = { admission: { schoolId } };
    if (from || to) {
      where.transferDate = {};
      if (from) where.transferDate.gte = new Date(from);
      if (to) where.transferDate.lte = new Date(to);
    }

    const transfers = await prisma.transferOutRequest.findMany({
      where,
      include: { admission: { include: { student: true, program: true } } },
      orderBy: { transferDate: 'desc' },
    });
    return { data: transfers, total: transfers.length };
  }

  async getFCR(schoolId: string, filters: any) {
    const { from, to, paymentMode } = filters;
    const where: any = { admission: { schoolId }, isCancelled: false };
    if (from || to) {
      where.receiptDate = {};
      if (from) where.receiptDate.gte = new Date(from);
      if (to) where.receiptDate.lte = new Date(to);
    }
    if (paymentMode) where.paymentMode = paymentMode;

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        admission: { include: { student: true, program: true } },
        deposit: true,
        invoice: true,
      },
      orderBy: { receiptDate: 'desc' },
    });

    const totalAmount = receipts.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    return { data: receipts, total: receipts.length, totalAmount };
  }

  async getFeeCard(schoolId: string, filters: any) {
    const { academicYearId, programId } = filters;
    const where: any = { schoolId, isActive: true };
    if (academicYearId) where.academicYearId = academicYearId;
    if (programId) where.programId = programId;

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        program: { select: { name: true, shortName: true } },
        academicYear: { select: { label: true } },
      },
      orderBy: [{ program: { sortOrder: 'asc' } }, { feeType: 'asc' }],
    });
    return { data: feeStructures, total: feeStructures.length };
  }

  async getAdmissionCount(schoolId: string, filters: any) {
    const { academicYearId } = filters;
    const yearFilter: any = academicYearId ? { academicYearId } : {};
    const programs = await prisma.program.findMany({ orderBy: { sortOrder: 'asc' } });

    const data = await Promise.all(
      programs.map(async (program: any) => {
        const [total, active, quit, transferOut, graduated] = await Promise.all([
          prisma.admission.count({ where: { schoolId, programId: program.id, deletedAt: null, ...yearFilter } }),
          prisma.admission.count({ where: { schoolId, programId: program.id, status: 'ACTIVE', deletedAt: null, ...yearFilter } }),
          prisma.admission.count({ where: { schoolId, programId: program.id, status: 'QUIT', deletedAt: null, ...yearFilter } }),
          prisma.admission.count({ where: { schoolId, programId: program.id, status: 'TRANSFERRED_OUT', deletedAt: null, ...yearFilter } }),
          prisma.admission.count({ where: { schoolId, programId: program.id, status: 'GRADUATED', deletedAt: null, ...yearFilter } }),
        ]);
        return { program: { name: program.name, shortName: program.shortName }, total, active, quit, transferOut, graduated };
      })
    );
    return { data };
  }

  async getEnquiryCount(schoolId: string, filters: any) {
    const { academicYearId } = filters;
    const yearFilter: any = academicYearId ? { academicYearId } : {};
    const programs = await prisma.program.findMany({ orderBy: { sortOrder: 'asc' } });

    const data = await Promise.all(
      programs.map(async (program: any) => {
        const count = await prisma.enquiry.count({ where: { schoolId, programId: program.id, deletedAt: null, ...yearFilter } });
        return { program: { id: program.id, name: program.name, shortName: program.shortName }, count };
      })
    );
    return { data };
  }

  async getOnlinePaymentsReport(schoolId: string, filters: any) {
    const { from, to } = filters;
    const where: any = {
      admission: { schoolId },
      paymentMode: { in: ['ONLINE', 'BANK_TRANSFER'] },
      isCancelled: false,
    };
    if (from || to) {
      where.receiptDate = {};
      if (from) where.receiptDate.gte = new Date(from);
      if (to) where.receiptDate.lte = new Date(to);
    }
    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        admission: { include: { student: true, program: true } },
        invoice: true,
      },
      orderBy: { receiptDate: 'desc' },
    });
    return { data: receipts, total: receipts.length };
  }

  async getForecastedRoyaltyReport(schoolId: string) {
    const royalties = await prisma.forecastedRoyalty.findMany({
      where: { admission: { schoolId } },
      include: {
        admission: {
          include: {
            student: { select: { firstName: true, lastName: true, uin: true } },
            program: { select: { name: true } },
          },
        },
      },
      orderBy: { month: 'asc' },
    });
    return { data: royalties, total: royalties.length };
  }
}

export const reportsService = new ReportsService();
