import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('📡 Connected to Database Host:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  // ── Academic Years ─────────────────────────────────────────
  const yearsToSeed = [
    { label: 'Apr 26 - Mar 27', isCurrent: true, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
    { label: 'Apr 26 - Mar 27 (MTA)', isCurrent: false, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
    { label: 'Apr 26 - Mar 27 (MYP)', isCurrent: false, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
    { label: 'Apr 25 - Mar 26 (MTA)', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
    { label: 'Apr 25 - Mar 26', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
    { label: 'Apr 25 - Mar 26 (MYP)', isCurrent: false, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
    { label: 'Jun 24 - May 25', isCurrent: false, startDate: new Date('2024-06-01'), endDate: new Date('2025-05-31') },
  ];

  const seededYears = [];
  for (const year of yearsToSeed) {
    const ay = await prisma.academicYear.upsert({
      where: { label: year.label },
      update: { isCurrent: year.isCurrent, startDate: year.startDate, endDate: year.endDate },
      create: { label: year.label, isCurrent: year.isCurrent, startDate: year.startDate, endDate: year.endDate },
    });
    seededYears.push(ay);
  }

  const ay2526 = seededYears.find((y) => y.label === 'Apr 25 - Mar 26')!;
  const ay2627 = seededYears.find((y) => y.label === 'Apr 26 - Mar 27')!;

  console.log('✅ Academic years created');

  // ── Programs ───────────────────────────────────────────────
  const programs = await Promise.all([
    prisma.program.upsert({
      where: { name: 'Play Group' },
      update: {},
      create: { name: 'Play Group', shortName: 'PG', ageFrom: 18, ageTo: 30, sortOrder: 1 },
    }),
    prisma.program.upsert({
      where: { name: 'Nursery' },
      update: {},
      create: { name: 'Nursery', shortName: 'NR', ageFrom: 30, ageTo: 42, sortOrder: 2 },
    }),
    prisma.program.upsert({
      where: { name: 'SUNOIA Junior' },
      update: {},
      create: { name: 'SUNOIA Junior', shortName: 'EJ', ageFrom: 42, ageTo: 54, sortOrder: 3 },
    }),
    prisma.program.upsert({
      where: { name: 'SUNOIA Senior' },
      update: {},
      create: { name: 'SUNOIA Senior', shortName: 'ES', ageFrom: 54, ageTo: 72, sortOrder: 4 },
    }),
  ]);

  console.log('✅ Programs created:', programs.map((p) => p.name));

  // ── Media Sources ──────────────────────────────────────────
  const mediaSources = [
    'Walk-in', 'Referral', 'Social Media', 'Website', 'Newspaper Ad',
    'Hoarding / Banner', 'School Event', 'Online Campaign', 'Pamphlet', 'Other',
  ];

  for (const name of mediaSources) {
    await prisma.mediaSource.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Media sources created');

  // ── School ─────────────────────────────────────────────────
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

  console.log('✅ School created:', school.name);

  // Link school to academic years
  for (const ay of seededYears) {
    await prisma.schoolAcademicYear.upsert({
      where: { schoolId_academicYearId: { schoolId: school.id, academicYearId: ay.id } },
      update: {},
      create: { schoolId: school.id, academicYearId: ay.id },
    });
  }

  // ── Batches ────────────────────────────────────────────────
  for (const program of programs) {
    const batchTimes = ['9:00 AM - 11:30 AM', '11:30 AM - 2:00 PM', '2:00 PM - 4:30 PM'];
    for (const timeSlot of batchTimes) {
      const existingBatch = await prisma.batch.findFirst({
        where: { programId: program.id, schoolId: school.id, timeSlot },
      });
      if (!existingBatch) {
        await prisma.batch.create({
          data: { timeSlot, capacity: 25, programId: program.id, schoolId: school.id },
        });
      }
    }
  }

  console.log('✅ Batches created');

  // ── Fee Structures ─────────────────────────────────────────
  const feeData = [
    { program: 'Play Group', registration: 5000, termFee: 15000, tuitionFee: 10000 },
    { program: 'Nursery', registration: 5000, termFee: 18000, tuitionFee: 12000 },
    { program: 'SUNOIA Junior', registration: 5000, termFee: 20000, tuitionFee: 14000 },
    { program: 'SUNOIA Senior', registration: 5000, termFee: 22000, tuitionFee: 16000 },
  ];

  for (const fee of feeData) {
    const program = programs.find((p) => p.name === fee.program)!;
    const feeEntries = [
      { feeType: 'REGISTRATION' as const, term1: fee.registration, term2: 0 },
      { feeType: 'TERM_FEE' as const, term1: fee.termFee, term2: fee.termFee },
      { feeType: 'TUITION_FEE' as const, term1: fee.tuitionFee, term2: fee.tuitionFee },
    ];

    for (const entry of feeEntries) {
      await prisma.feeStructure.upsert({
        where: {
          programId_academicYearId_schoolId_feeType: {
            programId: program.id,
            academicYearId: ay2627.id,
            schoolId: school.id,
            feeType: entry.feeType,
          },
        },
        update: {},
        create: {
          programId: program.id,
          academicYearId: ay2627.id,
          schoolId: school.id,
          feeType: entry.feeType,
          term1Amount: entry.term1,
          term2Amount: entry.term2,
          totalAmount: entry.term1 + entry.term2,
        },
      });
    }
  }

  console.log('✅ Fee structures created');

  // ── Discount Types ─────────────────────────────────────────
  const discounts = [
    { name: 'Sibling Discount', percentage: 10 },
    { name: 'Early Bird Discount', percentage: 5 },
    { name: 'Staff Discount', percentage: 15 },
  ];

  for (const disc of discounts) {
    const existing = await prisma.discountType.findFirst({
      where: { name: disc.name, schoolId: school.id },
    });
    if (!existing) {
      await prisma.discountType.create({
        data: { name: disc.name, percentage: disc.percentage, schoolId: school.id },
      });
    }
  }

  console.log('✅ Discount types created');

  // ── Users ──────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash },
    create: {
      username: 'admin',
      email: 'admin@sems.suryadhi.in',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      schoolId: school.id,
    },
  });

  await prisma.user.upsert({
    where: { username: 'school_admin' },
    update: {},
    create: {
      username: 'school_admin',
      email: 'schooladmin@sems.suryadhi.in',
      passwordHash,
      firstName: 'School',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });

  await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      email: 'teacher@sems.suryadhi.in',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Teacher',
      role: 'TEACHER',
      schoolId: school.id,
    },
  });

  console.log('✅ Users created (password: Admin@123)');

  // ── Sample Enquiries ───────────────────────────────────────
  const sampleEnquiries = [
    { name: 'Aarav Sharma', parent: 'Rajesh Sharma', mobile: '9876543001', program: 'Play Group' },
    { name: 'Ananya Patel', parent: 'Vikram Patel', mobile: '9876543002', program: 'Nursery' },
    { name: 'Vivaan Gupta', parent: 'Arun Gupta', mobile: '9876543003', program: 'SUNOIA Junior' },
    { name: 'Diya Singh', parent: 'Priya Singh', mobile: '9876543004', program: 'SUNOIA Senior' },
    { name: 'Arjun Reddy', parent: 'Suresh Reddy', mobile: '9876543005', program: 'Play Group' },
  ];

  for (const eq of sampleEnquiries) {
    const [firstName, lastName] = eq.name.split(' ');
    const program = programs.find((p) => p.name === eq.program)!;

    const existingStudent = await prisma.student.findFirst({
      where: { firstName, lastName },
    });

    if (!existingStudent) {
      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date('2022-06-15'),
          gender: Math.random() > 0.5 ? 'BOY' : 'GIRL',
        },
      });

      await prisma.enquiry.create({
        data: {
          enquirerName: eq.parent,
          enquirerMobile: eq.mobile,
          enquirerEmail: `${eq.parent.toLowerCase().replace(' ', '.')}@email.com`,
          enquirerAddress: 'Sample Address, Pune',
          stage: 'NEW',
          studentId: student.id,
          programId: program.id,
          academicYearId: ay2627.id,
          schoolId: school.id,
        },
      });
    }
  }

  console.log('✅ Sample enquiries created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Super Admin: admin / Admin@123');
  console.log('  School Admin: school_admin / Admin@123');
  console.log('  Teacher: teacher / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
