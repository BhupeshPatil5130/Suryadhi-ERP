import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, schoolScope } from '../../middleware';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/transfers/requests - Get all transfer requests for this school
router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;
    const { status } = req.query;

    const where: any = { admission: { schoolId } };
    if (status) where.status = status;

    const transfers = await prisma.transferOutRequest.findMany({
      where,
      include: {
        admission: {
          include: {
            student: { select: { firstName: true, lastName: true, uin: true, dateOfBirth: true } },
            program: { select: { name: true, shortName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: transfers, total: transfers.length });
  } catch (error) { next(error); }
});

// POST /api/transfers/request - Create transfer out request
router.post('/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { admissionId, toSchoolName, reason, transferDate } = req.body;
    const schoolId = req.user!.schoolId!;

    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, schoolId, status: 'ACTIVE', deletedAt: null },
      include: { student: true },
    });

    if (!admission) {
      res.status(404).json({ success: false, error: 'Active admission not found' });
      return;
    }

    const transfer = await prisma.$transaction(async (tx: any) => {
      const t = await tx.transferOutRequest.create({
        data: {
          admissionId,
          fromSchoolName: 'Current School',
          toSchoolName,
          reason,
          transferDate: new Date(transferDate),
          status: 'REQUESTED',
        },
      });

      await tx.admission.update({
        where: { id: admissionId },
        data: { status: 'TRANSFERRED_OUT' },
      });

      return t;
    });

    res.json({ success: true, data: transfer });
  } catch (error) { next(error); }
});

// PUT /api/transfers/:id/status - Update transfer status
router.put('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const transfer = await prisma.transferOutRequest.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: transfer });
  } catch (error) { next(error); }
});

export default router;
