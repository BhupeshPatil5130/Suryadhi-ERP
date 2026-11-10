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

    // Automatically migrate any legacy 'Mar' academic years in the DB to 'Apr to May'
    try {
      const legacyYears = await prisma.academicYear.findMany({
        where: { label: { contains: 'Mar' } },
      });
      for (const y of legacyYears) {
        const newLabel = y.label.replace(/Mar/g, 'May');
        const endDate = y.endDate ? new Date(y.endDate) : new Date('2027-05-31');
        endDate.setMonth(4); // May
        endDate.setDate(31);
        await prisma.academicYear.update({
          where: { id: y.id },
          data: {
            label: newLabel,
            endDate,
          },
        });
        logger.info(`🔄 Migrated academic year: ${y.label} -> ${newLabel}`);
      }
    } catch (e) {
      // Non-blocking if table not yet migrated
    }

    // Migrate any legacy invoiceNumber or student UIN containing INV- or SEMS-DEMO to standard SNK/xxxx/xxxx/2026 format
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { startsWith: 'INV-' } },
            { invoiceNumber: { contains: 'SEMS-DEMO' } },
          ],
        },
      });
      for (const inv of invoices) {
        const cleaned = inv.invoiceNumber.replace(/^INV[-_/]/i, '');
        const parts = cleaned.split('/');
        let newNum = inv.invoiceNumber;
        if (parts.length >= 4) {
          const schoolCode = (parts[1].replace(/[^0-9]/g, '') || '3201').slice(-4).padStart(4, '0');
          const seq = (parts[2].replace(/[^0-9]/g, '') || '0001').slice(-4).padStart(4, '0');
          let yr = parts[3].replace(/[^0-9]/g, '');
          if (yr.length === 4 && (yr.startsWith('26') || yr === '2627')) yr = '2026';
          else if (yr.length === 2) yr = `20${yr}`;
          else if (!yr) yr = '2026';
          newNum = `SNK/${schoolCode}/${seq}/${yr}`;
        } else {
          const digits = cleaned.replace(/[^0-9]/g, '');
          newNum = `SNK/3201/${(digits.slice(-4) || '0001').padStart(4, '0')}/2026`;
        }
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { invoiceNumber: newNum },
        });
        logger.info(`🔄 Migrated invoice number: ${inv.invoiceNumber} -> ${newNum}`);
      }

      const students = await prisma.student.findMany({
        where: {
          uin: { contains: 'SEMS-DEMO' },
        },
      });
      for (const stu of students) {
        if (!stu.uin) continue;
        const parts = stu.uin.split('/');
        if (parts.length >= 4) {
          const schoolCode = (parts[1].replace(/[^0-9]/g, '') || '3201').slice(-4).padStart(4, '0');
          const seq = (parts[2].replace(/[^0-9]/g, '') || '0001').slice(-4).padStart(4, '0');
          let yr = parts[3].replace(/[^0-9]/g, '');
          if (yr.length === 4 && (yr.startsWith('26') || yr === '2627')) yr = '2026';
          else if (yr.length === 2) yr = `20${yr}`;
          else if (!yr) yr = '2026';
          const newUin = `SNK/${schoolCode}/${seq}/${yr}`;
          await prisma.student.update({
            where: { id: stu.id },
            data: { uin: newUin },
          });
          logger.info(`🔄 Migrated student UIN: ${stu.uin} -> ${newUin}`);
        }
      }
    } catch (e) {
      // Non-blocking
    }

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

        // 2. Create current academic year (Apr to May)
        const ay = await prisma.academicYear.upsert({
          where: { label: 'Apr 26 - May 27' },
          update: {
            isCurrent: true,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2027-05-31'),
          },
          create: {
            label: 'Apr 26 - May 27',
            isCurrent: true,
            startDate: new Date('2026-04-01'),
            endDate: new Date('2027-05-31'),
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
