import { Router } from 'express';
import prisma from '../../config/database';
import { authenticate } from '../../middleware';

const router = Router();

// All lookup routes require authentication
router.use(authenticate);

// GET /api/lookups/schools
router.get('/schools', async (_req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: schools });
  } catch (error) { next(error); }
});

// GET /api/lookups/programs
router.get('/programs', async (_req, res, next) => {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, shortName: true },
    });
    res.json({ success: true, data: programs });
  } catch (error) { next(error); }
});

// GET /api/lookups/academic-years
router.get('/academic-years', async (_req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      select: { id: true, label: true, isCurrent: true, startDate: true, endDate: true },
    });
    res.json({ success: true, data: years });
  } catch (error) { next(error); }
});

// POST /api/lookups/academic-years - Create new academic year
router.post('/academic-years', async (req, res, next) => {
  try {
    const { label, startDate, endDate, isCurrent } = req.body;
    if (!label || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'label, startDate, and endDate are required' });
    }

    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }

    const year = await prisma.academicYear.create({
      data: {
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent),
      },
    });

    // Automatically link to all active schools
    const schools = await prisma.school.findMany({ where: { deletedAt: null } });
    for (const school of schools) {
      await prisma.schoolAcademicYear.upsert({
        where: { schoolId_academicYearId: { schoolId: school.id, academicYearId: year.id } },
        update: {},
        create: { schoolId: school.id, academicYearId: year.id },
      });
    }

    res.status(201).json({ success: true, data: year, message: 'Academic year created successfully' });
  } catch (error) { next(error); }
});

// PUT /api/lookups/academic-years/:id - Update academic year
router.put('/academic-years/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.academicYear.updateMany({ where: { id: { not: id } }, data: { isCurrent: false } });
    }

    const year = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) }),
      },
    });

    res.json({ success: true, data: year, message: 'Academic year updated successfully' });
  } catch (error) { next(error); }
});

// POST /api/lookups/academic-years/:id/set-current - Set active/current academic year
router.post('/academic-years/:id/set-current', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    const year = await prisma.academicYear.update({
      where: { id },
      data: { isCurrent: true },
    });
    res.json({ success: true, data: year, message: `Academic year '${year.label}' set as current` });
  } catch (error) { next(error); }
});

// DELETE /api/lookups/academic-years/:id - Delete academic year (with safety checks)
router.delete('/academic-years/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (!year) return res.status(404).json({ success: false, error: 'Academic year not found' });

    if (year.isCurrent) {
      return res.status(400).json({ success: false, error: 'Cannot delete the currently active academic year. Set another year as active first.' });
    }

    // Check for linked data
    const [admissionCount, enquiryCount] = await Promise.all([
      prisma.admission.count({ where: { academicYearId: id } }),
      prisma.enquiry.count({ where: { academicYearId: id } }),
    ]);

    if (admissionCount > 0 || enquiryCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete: this year has ${admissionCount} admission(s) and ${enquiryCount} enquiry/ies linked to it. Archive it instead.`,
      });
    }

    // Also unlink from schools before deleting
    await prisma.schoolAcademicYear.deleteMany({ where: { academicYearId: id } });
    await prisma.academicYear.delete({ where: { id } });

    res.json({ success: true, message: `Academic year '${year.label}' deleted successfully` });
  } catch (error) { next(error); }
});

// GET /api/lookups/media-sources
router.get('/media-sources', async (_req, res, next) => {
  try {
    const sources = await prisma.mediaSource.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    res.json({ success: true, data: sources });
  } catch (error) { next(error); }
});

// GET /api/lookups/batches
router.get('/batches', async (req, res, next) => {
  try {
    const { programId, schoolId } = req.query;
    const batches = await prisma.batch.findMany({
      where: {
        ...(programId && { programId: programId as string }),
        ...(schoolId && { schoolId: schoolId as string }),
      },
      select: { id: true, timeSlot: true, capacity: true, program: { select: { name: true } } },
    });
    res.json({ success: true, data: batches });
  } catch (error) { next(error); }
});

// GET /api/lookups/discount-types
router.get('/discount-types', async (req, res, next) => {
  try {
    const { schoolId } = req.query;
    const discounts = await prisma.discountType.findMany({
      where: schoolId ? { schoolId: schoolId as string } : {},
      select: { id: true, name: true, percentage: true, flatAmount: true },
    });
    res.json({ success: true, data: discounts });
  } catch (error) { next(error); }
});

export default router;
