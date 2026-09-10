import prisma from '../../config/database';

export class SOAService {
  async getSummary(schoolId: string, month?: string) {
    let dateFilter: any = {};
    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      dateFilter = { entryDate: { gte: startDate, lt: endDate } };
    }

    const [school, enrollmentCounts, programs, soaEntries, totalReceivable, totalCollected, summaryByType] =
      await Promise.all([
        prisma.school.findUnique({
          where: { id: schoolId },
          select: { name: true, code: true, address: true, email: true, fasId: true, phone: true, agreementPeriod: true, modelType: true, modelYear: true },
        }),
        prisma.admission.groupBy({
          by: ['programId'],
          where: { schoolId, status: 'ACTIVE', deletedAt: null },
          _count: { id: true },
        }),
        prisma.program.findMany({ select: { id: true, shortName: true } }),
        prisma.sOAEntry.findMany({ where: { schoolId, ...dateFilter }, orderBy: { entryDate: 'asc' } }),
        prisma.invoice.aggregate({ where: { admission: { schoolId }, deletedAt: null }, _sum: { netAmount: true } }),
        prisma.receipt.aggregate({ where: { admission: { schoolId }, isCancelled: false, deletedAt: null }, _sum: { amount: true } }),
        prisma.sOAEntry.groupBy({
          by: ['entryType'],
          where: { schoolId, ...dateFilter },
          _sum: { invoiceAmount: true, receiptAmount: true },
        }),
      ]);

    const enrollments: Record<string, number> = { total: 0 };
    enrollmentCounts.forEach((ec: any) => {
      const program = programs.find((p: any) => p.id === ec.programId);
      if (program?.shortName) {
        enrollments[program.shortName] = ec._count.id;
      }
      enrollments.total += ec._count.id;
    });

    const receivable = Number(totalReceivable._sum.netAmount || 0);
    const collected = Number(totalCollected._sum.amount || 0);

    const statementSummary = summaryByType.map((s: any) => ({
      collectionType: s.entryType,
      invoiceCharges: Number(s._sum.invoiceAmount || 0),
      receiptsCredits: Number(s._sum.receiptAmount || 0),
      balance: Number(s._sum.invoiceAmount || 0) - Number(s._sum.receiptAmount || 0),
    }));

    return {
      school,
      enrollments,
      feeRoyaltyStatement: {
        feesReceivable: receivable,
        feesCollected: collected,
        feesDue: receivable - collected,
        royaltyDue: 0,
      },
      statementSummary,
      soaEntries,
    };
  }

  async getDetails(schoolId: string, month?: string) {
    let dateFilter: any = {};
    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      dateFilter = { entryDate: { gte: startDate, lt: endDate } };
    }

    const [entries, forecastedRoyalty] = await Promise.all([
      prisma.sOAEntry.findMany({
        where: { schoolId, ...dateFilter },
        orderBy: [{ entryType: 'asc' }, { entryDate: 'asc' }],
      }),
      prisma.forecastedRoyalty.findMany({
        where: { admission: { schoolId } },
        orderBy: { month: 'asc' },
      }),
    ]);

    const grouped: Record<string, typeof entries> = {};
    entries.forEach((entry: any) => {
      if (!grouped[entry.entryType]) grouped[entry.entryType] = [];
      grouped[entry.entryType].push(entry);
    });

    const monthlyForecast = forecastedRoyalty.reduce((acc: Record<string, number>, fr: any) => {
      const key = `${fr.month.getFullYear()}-${String(fr.month.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + Number(fr.amount);
      return acc;
    }, {});

    return {
      transactions: grouped,
      forecastedRoyalty: Object.entries(monthlyForecast).map(([month, amount]) => ({ month, amount })),
    };
  }
}

export const soaService = new SOAService();
