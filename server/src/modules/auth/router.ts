import { Router } from 'express';
import { authController } from './controller';
import { authenticate, authorize, validate, authRateLimiter } from '../../middleware';
import { loginSchema, signupSchema, updateProfileSchema, createUserSchema, updateUserSchema } from './schema';

const router = Router();

// POST /api/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/signup
router.post('/signup', authRateLimiter, validate(signupSchema), (req, res, next) =>
  authController.signup(req, res, next)
);

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res, next) =>
  authController.logout(req, res, next)
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

// PUT /api/auth/profile
router.put('/profile', authenticate, validate(updateProfileSchema), (req, res, next) =>
  authController.updateProfile(req, res, next)
);

// GET /api/auth/users
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res, next) =>
  authController.listUsers(req, res, next)
);

// POST /api/auth/users
router.post('/users', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), validate(createUserSchema), (req, res, next) =>
  authController.createUser(req, res, next)
);

// PUT /api/auth/users/:id
router.put('/users/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), validate(updateUserSchema), (req, res, next) =>
  authController.updateUser(req, res, next)
);

// DELETE /api/auth/users/:id
router.delete('/users/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res, next) =>
  authController.deleteUser(req, res, next)
);

import prisma from '../../config/database';
import bcrypt from 'bcryptjs';

router.get('/create-rahul', async (req, res) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return res.status(400).send('No school');
    
    const passwordHash = await bcrypt.hash('Suryadhi@7474', 12);
    await prisma.user.upsert({
      where: { username: 'Rahul.Khandale' },
      update: { passwordHash, schoolId: school.id },
      create: {
        username: 'Rahul.Khandale',
        email: 'rahul.khandale@sems.suryadhi.in',
        passwordHash,
        firstName: 'Rahul',
        lastName: 'Khandale',
        role: 'SUPER_ADMIN',
        schoolId: school.id,
      },
    });

    const yearsToSeed = [
      { label: 'Apr 26 - Mar 27', isCurrent: true, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
      { label: 'Apr 26 - Mar 27 (MTA)', isCurrent: false, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
      { label: 'Apr 26 - Mar 27 (MYP)', isCurrent: false, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
      { label: 'Apr 25 - Mar 26 (MTA)', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
      { label: 'Apr 25 - Mar 26', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
      { label: 'Apr 25 - Mar 26 (MYP)', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
      { label: 'Jun 24 - May 25', isCurrent: false, startDate: new Date('2024-06-01'), endDate: new Date('2025-05-31') },
    ];

    for (const year of yearsToSeed) {
      const ay = await prisma.academicYear.upsert({
        where: { label: year.label },
        update: { isCurrent: year.isCurrent, startDate: year.startDate, endDate: year.endDate },
        create: { label: year.label, isCurrent: year.isCurrent, startDate: year.startDate, endDate: year.endDate },
      });

      // Link school to academic year
      await prisma.schoolAcademicYear.upsert({
        where: { schoolId_academicYearId: { schoolId: school.id, academicYearId: ay.id } },
        update: {},
        create: { schoolId: school.id, academicYearId: ay.id },
      });
    }

    res.send('Rahul created and Academic Years seeded successfully');
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

export default router;
