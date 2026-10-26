import { prisma } from './database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

/**
 * Initializes database connectivity and performs bootstrap auto-seeding
 * if the database has zero existing users (e.g. fresh Render deployment).
 */
export async function initDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        logger.info('🌱 Fresh database detected (0 users). Initializing bootstrap seed...');

        // 1. Create or get default demo school
        const school = await prisma.school.upsert({
          where: { code: 'SEMS-DEMO-001' },
          update: {},
          create: {
            code: 'SEMS-DEMO-001',
            name: 'SŪNOIAKIDS™ Demo Pre-School',
            address: '123 Education Lane, Sector 5',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411001',
            country: 'India',
            email: 'demo@suryadhi.local',
            phone: '9876543210',
            fasId: 'FAS-001',
            agreementPeriod: '2024-2029',
            modelType: 'Franchise',
            modelYear: '2024',
          },
        });

        // 2. Create current academic year
        const ay = await prisma.academicYear.upsert({
          where: { label: 'Apr 26 - Mar 27' },
          update: {},
          create: {
            label: 'Apr 26 - Mar 27',
            isCurrent: true,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2027-03-31'),
          },
        });

        await prisma.schoolAcademicYear.upsert({
          where: {
            schoolId_academicYearId: {
              schoolId: school.id,
              academicYearId: ay.id,
            },
          },
          update: {},
          create: {
            schoolId: school.id,
            academicYearId: ay.id,
          },
        });

        // 3. Create default programs
        const defaultPrograms = [
          { name: 'Play Group', shortName: 'PG', ageFrom: 18, ageTo: 30, sortOrder: 1 },
          { name: 'Nursery', shortName: 'NR', ageFrom: 30, ageTo: 42, sortOrder: 2 },
          { name: 'SUNOIA Junior', shortName: 'EJ', ageFrom: 42, ageTo: 54, sortOrder: 3 },
          { name: 'SUNOIA Senior', shortName: 'ES', ageFrom: 54, ageTo: 72, sortOrder: 4 },
        ];

        for (const prog of defaultPrograms) {
          await prisma.program.upsert({
            where: { name: prog.name },
            update: {},
            create: prog,
          });
        }

        // 4. Create default Super Admin user
        const passwordHash = await bcrypt.hash('Admin@123', 12);
        await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@sems.suryadhi.in',
            passwordHash,
            firstName: 'System',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            schoolId: school.id,
          },
        });

        logger.info('🎉 Bootstrap seeding complete! Default credentials: admin / Admin@123');
      }
    } catch (tableErr: any) {
      logger.warn(
        { err: tableErr.message },
        '⚠️ Database tables not found or pending migration. Ensure "npx prisma db push" has run.'
      );
    }
  } catch (connErr: any) {
    logger.error({ err: connErr.message }, '❌ Database connection failed during startup');
  }
}
