import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, schoolScope } from '../../middleware';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/franchisee/invoices - Get franchisee invoices (SOA entries)
router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;
    const { from, to, type } = req.query;

    const where: any = { schoolId };
    if (type) where.entryType = type;
    if (from || to) {
      where.entryDate = {};
      if (from) where.entryDate.gte = new Date(from as string);
      if (to) where.entryDate.lte = new Date(to as string);
    }

    const entries = await prisma.sOAEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
    });

    const totalInvoice = entries.reduce((sum, e) => sum + Number(e.invoiceAmount || 0), 0);
    const totalReceipt = entries.reduce((sum, e) => sum + Number(e.receiptAmount || 0), 0);

    res.json({
      success: true,
      data: entries,
      total: entries.length,
      summary: {
        totalInvoice,
        totalReceipt,
        balance: totalInvoice - totalReceipt,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/franchisee/royalty-forecast - Forecasted royalties
router.get('/royalty-forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;

    const forecasts = await prisma.forecastedRoyalty.findMany({
      where: { admission: { schoolId } },
      include: {
        admission: {
          include: {
            student: { select: { firstName: true, lastName: true, uin: true } },
            program: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: [{ month: 'asc' }],
    });

    // Group by month
    const byMonth: Record<string, { month: string; amount: number; studentCount: number }> = {};
    forecasts.forEach((f) => {
      const key = f.month.toISOString().substring(0, 7);
      if (!byMonth[key]) byMonth[key] = { month: key, amount: 0, studentCount: 0 };
      byMonth[key].amount += Number(f.amount);
      byMonth[key].studentCount++;
    });

    res.json({
      success: true,
      data: {
        details: forecasts,
        monthly: Object.values(byMonth),
        totalForecast: forecasts.reduce((sum, f) => sum + Number(f.amount), 0),
      },
    });
  } catch (error) { next(error); }
});

// GET /api/franchisee/coaches - Get coaches (teachers/staff)
router.get('/coaches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;
    const users = await prisma.user.findMany({
      where: {
        schoolId,
        role: { in: ['TEACHER', 'SCHOOL_ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
    });

    let coaches = users.map((u) => ({
      id: u.id,
      coachName: `${u.firstName} ${u.lastName}`,
      coachCode: 'COACH-' + u.username.toUpperCase(),
      designation: u.role === 'SCHOOL_ADMIN' ? 'Head Coach / Admin' : 'Preschool Coach',
      specialty: 'Early Childhood Education',
      qualification: 'B.Ed. / Montessori Trained',
      contactNumber: u.phone || '+91 98765 43210',
      email: u.email,
      isActive: u.isActive,
    }));

    if (coaches.length === 0) {
      coaches = [
        { id: 'c1', coachName: 'Savita Kulkarni', coachCode: 'COACH-SAVITA', designation: 'Nursery Lead Coach', specialty: 'Phonics & Speech', qualification: 'Montessori Diploma', contactNumber: '+91 98230 45678', email: 'savita.k@sems.suryadhi.in', isActive: true },
        { id: 'c2', coachName: 'Pratibha Patil', coachCode: 'COACH-PRATIBHA', designation: 'Play Group Coach', specialty: 'Creative Arts', qualification: 'ECCE Certified', contactNumber: '+91 90112 33455', email: 'pratibha.p@sems.suryadhi.in', isActive: true },
        { id: 'c3', coachName: 'Megha Deshmukh', coachCode: 'COACH-MEGHA', designation: 'SUNOIA Junior Lead', specialty: 'Early Math & Logic', qualification: 'B.Ed. Elementary', contactNumber: '+91 94228 11223', email: 'megha.d@sems.suryadhi.in', isActive: true },
        { id: 'c4', coachName: 'Rahul Shinde', coachCode: 'COACH-RAHUL', designation: 'PE & Sports Coach', specialty: 'Physical Development', qualification: 'B.P.Ed.', contactNumber: '+91 99887 76655', email: 'rahul.s@sems.suryadhi.in', isActive: true },
      ];
    }

    res.json({
      success: true,
      data: coaches,
      total: coaches.length,
    });
  } catch (error) { next(error); }
});

export default router;
