import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { authenticate, schoolScope } from '../../middleware';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/graduation/list - Get graduations (homebuddy)
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId!;
    const { programId, academicYearId } = req.query;

    const where: any = {
      admission: { schoolId, deletedAt: null },
    };
    if (programId) where.fromProgramId = programId;

    const graduations = await prisma.graduation.findMany({
      where,
      include: {
        admission: {
          include: {
            student: { select: { firstName: true, lastName: true, uin: true, dateOfBirth: true } },
            program: { select: { name: true, shortName: true } },
          },
        },
        fromProgram: { select: { name: true, shortName: true } },
        toProgram: { select: { name: true, shortName: true } },
      },
      orderBy: { graduationDate: 'desc' },
    });

    res.json({ success: true, data: graduations, total: graduations.length });
  } catch (error) { next(error); }
});

// POST /api/graduation/:admissionId - Graduate a student
router.post('/:admissionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admissionId = req.params.admissionId as string;
    const { toProgramId, graduationDate, isHomebuddy } = req.body;
    const schoolId = req.user!.schoolId!;

    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, schoolId, deletedAt: null },
    });

    if (!admission) {
      res.status(404).json({ success: false, error: 'Admission not found' });
      return;
    }

    const graduation = await prisma.$transaction(async (tx) => {
      const grad = await tx.graduation.create({
        data: {
          admissionId,
          fromProgramId: admission.programId,
          toProgramId,
          graduationDate: new Date(graduationDate),
          isHomebuddy: isHomebuddy || false,
        },
      });

      await tx.admission.update({
        where: { id: admissionId },
        data: { status: 'GRADUATED', programId: toProgramId },
      });

      return grad;
    });

    res.json({ success: true, data: graduation });
  } catch (error) { next(error); }
});

export default router;
