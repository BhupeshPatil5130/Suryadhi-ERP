import prisma from '../../config/database';

const DEFAULT_DOWNLOAD_LIMIT = 5000;
const MAX_DOWNLOAD_LIMIT = 10000;

export function getDownloadLimit(filters?: any): number {
  if (!filters || filters.limit === undefined || filters.limit === null) return DEFAULT_DOWNLOAD_LIMIT;
  const parsed = parseInt(String(filters.limit), 10);
  if (isNaN(parsed) || parsed <= 0) return DEFAULT_DOWNLOAD_LIMIT;
  return Math.min(parsed, MAX_DOWNLOAD_LIMIT);
}

/**
 * DownloadService
 * Provides raw data for every downloadable entity in the ERP.
 * The router/controller layer converts this into CSV/JSON and pipes it to the client.
 */
export class DownloadService {

  // ─── Admissions ───────────────────────────────────────────────

  async admissions(schoolId: string, filters: any) {
    const { academicYearId, programId, status, from, to } = filters;
    const where: any = { schoolId, deletedAt: null };
    if (academicYearId) where.academicYearId = academicYearId;
    if (programId)      where.programId = programId;
    if (status)         where.status = status;
    if (from || to) {
      where.admissionDate = {};
      if (from) where.admissionDate.gte = new Date(from as string);
      if (to)   where.admissionDate.lte = new Date(to as string);
    }

    const rows = await prisma.admission.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        student: { include: { parent: true } },
        program: true,
        batch: true,
        academicYear: true,
        discountType: true,
      },
      orderBy: { admissionDate: 'desc' },
    });

    return rows.map((r) => ({
      UIN: r.student.uin,
      'First Name': r.student.firstName,
      'Last Name': r.student.lastName,
      'Date of Birth': r.student.dateOfBirth ? new Date(r.student.dateOfBirth).toLocaleDateString('en-IN') : '',
      Gender: r.student.gender ?? '',
      Program: r.program.name,
      Batch: r.batch?.timeSlot ?? '',
      'Academic Year': r.academicYear?.label ?? '',
      'Admission Date': new Date(r.admissionDate).toLocaleDateString('en-IN'),
      Status: r.status,
      'Admission Type': r.admissionType ?? '',
      'Father Name': r.student.parent?.fatherName ?? '',
      'Father Mobile': r.student.parent?.fatherMobile ?? '',
      'Mother Name': r.student.parent?.motherName ?? '',
      'Mother Mobile': r.student.parent?.motherMobile ?? '',
      'Discount Type': r.discountType?.name ?? '',
    }));
  }

  // ─── Enquiries ────────────────────────────────────────────────

  async enquiries(schoolId: string, filters: any) {
    const { academicYearId, programId, stage, from, to } = filters;
    const where: any = { schoolId, deletedAt: null };
    if (academicYearId) where.academicYearId = academicYearId;
    if (programId)      where.programId = programId;
    if (stage)          where.stage = stage;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to)   where.createdAt.lte = new Date(to as string);
    }

    const rows = await prisma.enquiry.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        student: { include: { parent: true } },
        program: true,
        mediaSource: true,
        academicYear: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      'Enquiry Date': new Date(r.createdAt).toLocaleDateString('en-IN'),
      'Student Name': `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.trim(),
      Program: r.program?.name ?? '',
      'Academic Year': r.academicYear?.label ?? '',
      Stage: r.stage ?? '',
      'Lead Source': r.mediaSource?.name ?? '',
      'Father Name': r.student?.parent?.fatherName ?? '',
      'Father Mobile': r.student?.parent?.fatherMobile ?? '',
      'Mother Name': r.student?.parent?.motherName ?? '',
      'Mother Mobile': r.student?.parent?.motherMobile ?? '',
      Remarks: (r as any).remarks ?? '',
    }));
  }

  // ─── Receipts (FCR – Fee Collection Report) ───────────────────

  async receipts(schoolId: string, filters: any) {
    const { from, to, paymentMode } = filters;
    const where: any = { admission: { schoolId }, isCancelled: false };
    if (paymentMode) where.paymentMode = paymentMode;
    if (from || to) {
      where.receiptDate = {};
      if (from) where.receiptDate.gte = new Date(from as string);
      if (to)   where.receiptDate.lte = new Date(to as string);
    }

    const rows = await prisma.receipt.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        admission: {
          include: {
            student: true,
            program: true,
            academicYear: true,
          },
        },
      },
      orderBy: { receiptDate: 'desc' },
    });

    return rows.map((r) => ({
      'Receipt Number': r.receiptNumber,
      'Receipt Date': new Date(r.receiptDate).toLocaleDateString('en-IN'),
      UIN: r.admission.student.uin,
      'Student Name': `${r.admission.student.firstName} ${r.admission.student.lastName}`,
      Program: r.admission.program.name,
      'Academic Year': r.admission.academicYear?.label ?? '',
      'Payment Mode': r.paymentMode,
      Amount: Number(r.amount),
      Remarks: (r as any).remarks ?? '',
    }));
  }

  // ─── Invoices (Franchisee SOA) ────────────────────────────────

  async invoices(schoolId: string, filters: any) {
    const { from, to, entryType } = filters;
    const where: any = { schoolId };
    if (entryType) where.entryType = entryType;
    if (from || to) {
      where.entryDate = {};
      if (from) where.entryDate.gte = new Date(from as string);
      if (to)   where.entryDate.lte = new Date(to as string);
    }

    const rows = await prisma.sOAEntry.findMany({
      where,
      take: getDownloadLimit(filters),
      orderBy: { entryDate: 'asc' },
    });

    return rows.map((r: any) => ({
      Date: new Date(r.entryDate).toLocaleDateString('en-IN'),
      Particulars: r.particulars,
      Type: r.entryType,
      'Invoice Amount': Number(r.invoiceAmount),
      'Receipt Amount': Number(r.receiptAmount),
      Balance: Number(r.balance),
    }));
  }

  // ─── Students ────────────────────────────────────────────────

  async students(schoolId: string, filters: any) {
    const { programId, status } = filters;
    const where: any = {
      admissions: { some: { schoolId, deletedAt: null } },
    };

    const rows = await prisma.student.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        parent: true,
        admissions: {
          where: { schoolId, deletedAt: null },
          include: { program: true, batch: true, academicYear: true },
          orderBy: { admissionDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return rows.map((s) => {
      const adm = s.admissions[0];
      return {
        UIN: s.uin,
        'First Name': s.firstName,
        'Last Name': s.lastName,
        'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '',
        Gender: s.gender ?? '',
        Program: adm?.program?.name ?? '',
        Batch: adm?.batch?.timeSlot ?? '',
        'Academic Year': adm?.academicYear?.label ?? '',
        Status: adm?.status ?? '',
        'Father Name': s.parent?.fatherName ?? '',
        'Father Mobile': s.parent?.fatherMobile ?? '',
        'Mother Name': s.parent?.motherName ?? '',
        'Mother Mobile': s.parent?.motherMobile ?? '',
        Email: s.parent?.fatherEmail || s.parent?.motherEmail || '',
        Address: s.address ?? '',
      };
    });
  }

  // ─── Attendance ───────────────────────────────────────────────

  async attendance(schoolId: string, filters: any) {
    const { date, programId, batchId } = filters;
    const where: any = { schoolId };
    if (date) where.date = new Date(date as string);
    if (batchId) where.batchId = batchId;

    const rows = await prisma.studentAttendance.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        student: true,
        batch: true,
      },
      orderBy: { date: 'desc' },
    });

    return rows.map((r: any) => ({
      Date: new Date(r.date).toLocaleDateString('en-IN'),
      UIN: r.student.uin,
      'Student Name': `${r.student.firstName} ${r.student.lastName}`,
      Program: '',
      Batch: r.batch?.timeSlot ?? '',
      Status: r.status,
      Remarks: r.remarks ?? '',
    }));
  }

  // ─── Payment Due Report ────────────────────────────────────────

  async paymentDue(schoolId: string, filters?: any) {
    const dues = await prisma.admission.findMany({
      where: {
        schoolId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      take: getDownloadLimit(filters),
      include: {
        student: { include: { parent: true } },
        program: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return dues.map((d) => ({
      UIN: d.student.uin,
      'Student Name': `${d.student.firstName} ${d.student.lastName}`,
      Program: d.program.name,
      'Father Mobile': d.student.parent?.fatherMobile ?? '',
      'Outstanding Balance': Number(d.invoices[0]?.netAmount ?? 0),
    }));
  }

  // ─── Transfers ────────────────────────────────────────────────

  async transfers(schoolId: string, filters: any) {
    const rows = await prisma.transferOutRequest.findMany({
      where: {
        admission: { schoolId },
      },
      take: getDownloadLimit(filters),
      include: {
        admission: {
          include: {
            student: true,
            program: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r: any) => ({
      'Transfer Date': new Date(r.createdAt).toLocaleDateString('en-IN'),
      UIN: r.admission.student.uin,
      'Student Name': `${r.admission.student.firstName} ${r.admission.student.lastName}`,
      Program: r.admission.program.name,
      'From School': r.fromSchoolName ?? '',
      'To School': r.toSchoolName ?? '',
      Status: r.status,
    }));
  }

  // ─── Fee Card ────────────────────────────────────────────────

  async feeCard(schoolId: string, filters: any) {
    const { programId } = filters;
    const where: any = { schoolId, isActive: true };
    if (programId) where.programId = programId;

    const rows = await prisma.feeStructure.findMany({
      where,
      take: getDownloadLimit(filters),
      include: { program: true },
      orderBy: [{ program: { name: 'asc' } }, { feeType: 'asc' }],
    });

    return rows.map((r) => ({
      Program: r.program.name,
      'Fee Type': r.feeType,
      'Term 1 Amount': Number(r.term1Amount),
      'Term 2 Amount': Number(r.term2Amount),
      'Total Amount': Number(r.totalAmount),
    }));
  }

  // ─── Cancelled Receipts ────────────────────────────────────────

  async cancelledReceipts(schoolId: string, filters?: any) {
    const rows = await prisma.receipt.findMany({
      where: { admission: { schoolId }, isCancelled: true },
      take: getDownloadLimit(filters),
      include: {
        admission: { include: { student: true, program: true } },
      },
      orderBy: { cancelledAt: 'desc' },
    });

    return rows.map((r) => ({
      'Receipt Number': r.receiptNumber,
      'Receipt Date': new Date(r.receiptDate).toLocaleDateString('en-IN'),
      'Cancelled Date': r.cancelledAt ? new Date(r.cancelledAt).toLocaleDateString('en-IN') : '',
      UIN: r.admission.student.uin,
      'Student Name': `${r.admission.student.firstName} ${r.admission.student.lastName}`,
      Program: r.admission.program.name,
      Amount: Number(r.amount),
      'Cancel Reason': r.cancelReason ?? '',
    }));
  }

  // ─── Operations: Purchase Orders ──────────────────────────────

  async purchaseOrders(schoolId: string, filters?: any) {
    const rows = await prisma.purchaseOrder.findMany({
      where: { schoolId },
      take: getDownloadLimit(filters),
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      'PO Number': r.orderNumber,
      'PO Date': r.orderedAt ? new Date(r.orderedAt).toLocaleDateString('en-IN') : new Date(r.createdAt).toLocaleDateString('en-IN'),
      'Vendor Name': (r as any).vendorName ?? '',
      'Vendor Code': (r as any).vendorCode ?? '',
      'Total Amount': Number(r.totalAmount),
      Status: r.status,
      Items: Array.isArray(r.items) ? (r.items as any[]).length : 0,
    }));
  }

  // ─── Online Payments ──────────────────────────────────────────

  async onlinePayments(schoolId: string, filters: any) {
    const { from, to } = filters;
    const where: any = {
      admission: { schoolId },
      paymentMode: { in: ['ONLINE', 'BANK_TRANSFER'] },
      isCancelled: false,
    };
    if (from || to) {
      where.receiptDate = {};
      if (from) where.receiptDate.gte = new Date(from as string);
      if (to)   where.receiptDate.lte = new Date(to as string);
    }

    const rows = await prisma.receipt.findMany({
      where,
      take: getDownloadLimit(filters),
      include: {
        admission: { include: { student: true, program: true } },
      },
      orderBy: { receiptDate: 'desc' },
    });

    return rows.map((r) => ({
      'Receipt Number': r.receiptNumber,
      'Payment Date': new Date(r.receiptDate).toLocaleDateString('en-IN'),
      UIN: r.admission.student.uin,
      'Student Name': `${r.admission.student.firstName} ${r.admission.student.lastName}`,
      Program: r.admission.program.name,
      'Payment Mode': r.paymentMode,
      Amount: Number(r.amount),
    }));
  }

  // ─── Graduation ────────────────────────────────────────────────

  async graduation(schoolId: string, filters?: any) {
    const rows = await prisma.graduation.findMany({
      where: { admission: { schoolId } },
      take: getDownloadLimit(filters),
      include: {
        admission: {
          include: {
            student: true,
            program: true,
            batch: true,
          },
        },
      },
      orderBy: { graduationDate: 'desc' },
    });

    return rows.map((r) => ({
      'Graduation Date': r.graduationDate ? new Date(r.graduationDate).toLocaleDateString('en-IN') : '',
      UIN: r.admission.student.uin,
      'Student Name': `${r.admission.student.firstName} ${r.admission.student.lastName}`,
      Program: r.admission.program.name,
      Batch: r.admission.batch?.timeSlot ?? '',
      Status: r.admission.status ?? '',
    }));
  }

  // ─── SOA Ledger (per admission) ────────────────────────────────

  async soaLedger(admissionId: string, filters?: any) {
    const rows = await prisma.sOAEntry.findMany({
      where: { schoolId: admissionId },
      take: getDownloadLimit(filters),
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r: any) => ({
      Date: new Date(r.createdAt).toLocaleDateString('en-IN'),
      Particulars: r.particulars,
      'Receipt No': (r as any).receipt?.receiptNumber ?? '',
      Mode: (r as any).receipt?.paymentMode ?? '',
      'Debit (₹)': Number(r.invoiceAmount ?? 0),
      'Credit (₹)': Number(r.receiptAmount ?? 0),
      'Balance (₹)': Number(r.balance ?? 0),
    }));
  }

  // ─── Quit / Withdrawn ─────────────────────────────────────────

  async quit(schoolId: string, filters?: any) {
    const rows = await prisma.admission.findMany({
      where: { schoolId, status: 'QUIT', deletedAt: null },
      take: getDownloadLimit(filters),
      include: {
        student: { include: { parent: true } },
        program: true,
        batch: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((r) => ({
      UIN: r.student.uin,
      'Student Name': `${r.student.firstName} ${r.student.lastName}`,
      Program: r.program.name,
      Batch: r.batch?.timeSlot ?? '',
      'Father Mobile': r.student.parent?.fatherMobile ?? '',
      'Quit Reason': (r as any).quitReason ?? '',
    }));
  }
}

export const downloadService = new DownloadService();
