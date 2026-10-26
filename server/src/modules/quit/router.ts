import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, schoolScope } from '../../middleware';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/quit/list - Get quit records
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;
    const { from, to } = req.query;

    const where: any = { admission: { schoolId } };
    if (from || to) {
      where.quitDate = {};
      if (from) where.quitDate.gte = new Date(from as string);
      if (to) where.quitDate.lte = new Date(to as string);
    }

    const quitRecords = await prisma.quitRecord.findMany({
      where,
      include: {
        admission: {
          include: {
            student: { select: { firstName: true, lastName: true, uin: true, dateOfBirth: true } },
            program: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { quitDate: 'desc' },
    });

    res.json({ success: true, data: quitRecords, total: quitRecords.length });
  } catch (error) { next(error); }
});

// POST /api/quit/:admissionId - Quit an admission
router.post('/:admissionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admissionId = req.params.admissionId as string;
    const { reason, quitDate, isDuplicate } = req.body;
    const schoolId = req.user!.schoolId!;

    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, schoolId, status: 'ACTIVE', deletedAt: null },
    });

    if (!admission) {
      res.status(404).json({ success: false, error: 'Active admission not found' });
      return;
    }

    const quitRecord = await prisma.$transaction(async (tx) => {
      const quit = await tx.quitRecord.create({
        data: {
          admissionId,
          reason,
          quitDate: quitDate ? new Date(quitDate) : new Date(),
          isDuplicate: isDuplicate || false,
        },
      });

      await tx.admission.update({
        where: { id: admissionId },
        data: { status: 'QUIT' },
      });

      return quit;
    });

    res.json({ success: true, data: quitRecord });
  } catch (error) { next(error); }
});

export default router;
