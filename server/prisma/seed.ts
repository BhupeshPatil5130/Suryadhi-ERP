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
    const batchTimes = ['Morning Shift', 'Late Morning Shift'];
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

  // ── Core Sample Admissions & Students ─────────────────────
  const sampleStudents = [
    {
      uin: 'SNK/3201/0001/2027',
      firstName: 'Gurvesh',
      middleName: 'Ganesh',
      lastName: 'Rathod',
      dob: new Date('2022-04-10'),
      gender: 'BOY' as const,
      fatherName: 'Ganesh Rathod',
      motherName: 'Rekha Rathod',
      fatherMobile: '9822114455',
      motherMobile: '9822114456',
      fatherEmail: 'ganesh.rathod@sunoiakids.com',
      program: 'Nursery',
      term1Amount: 15800,
      term2Amount: 8000,
      paidAmount: 0,
    },
    {
      uin: 'SNK/3201/0002/2027',
      firstName: 'Shourya',
      middleName: 'Sachin',
      lastName: 'Bhoyar',
      dob: new Date('2021-08-14'),
      gender: 'BOY' as const,
      fatherName: 'Sachin Bhoyar',
      motherName: 'Savita Bhoyar',
      fatherMobile: '8149811545',
      motherMobile: '8999313214',
      fatherEmail: 'sachin.bhoyar@sunoiakids.com',
      program: 'SUNOIA Junior',
      term1Amount: 25000,
      term2Amount: 20000,
      paidAmount: 25000,
    },
    {
      uin: 'SNK/3201/0003/2027',
      firstName: 'Aarohi',
      middleName: 'Santosh',
      lastName: 'Sonare',
      dob: new Date('2021-11-20'),
      gender: 'GIRL' as const,
      fatherName: 'Santosh Sonare',
      motherName: 'Kavita Sonare',
      fatherMobile: '9370005720',
      motherMobile: '9325944111',
      fatherEmail: 'santosh.sonare@sunoiakids.com',
      program: 'SUNOIA Junior',
      term1Amount: 25000,
      term2Amount: 20000,
      paidAmount: 15000,
    },
    {
      uin: 'SNK/3201/0004/2027',
      firstName: 'Dnyanda',
      middleName: 'Nandkishor',
      lastName: 'Bawane',
      dob: new Date('2021-09-05'),
      gender: 'GIRL' as const,
      fatherName: 'Nandkishor Bawane',
      motherName: 'Sunita Bawane',
      fatherMobile: '9552407021',
      motherMobile: '9145460195',
      fatherEmail: 'nandkishor.bawane@sunoiakids.com',
      program: 'SUNOIA Junior',
      term1Amount: 25000,
      term2Amount: 20000,
      paidAmount: 20000,
    },
    {
      uin: 'SNK/3201/0005/2027',
      firstName: 'Alfaz',
      middleName: 'Baig',
      lastName: 'Mirza',
      dob: new Date('2021-05-18'),
      gender: 'BOY' as const,
      fatherName: 'Furhan Baig Mirza',
      motherName: 'Sultana Mirza',
      fatherMobile: '7721024102',
      motherMobile: '7400051112',
      fatherEmail: 'furhan.mirza@sunoiakids.com',
      program: 'SUNOIA Junior',
      term1Amount: 25000,
      term2Amount: 20000,
      paidAmount: 12000,
    },
    {
      uin: 'SNK/3201/0006/2027',
      firstName: 'Rudransh',
      middleName: 'Vaibhav',
      lastName: 'Deshmukh',
      dob: new Date('2020-07-22'),
      gender: 'BOY' as const,
      fatherName: 'Vaibhav Deshmukh',
      motherName: 'Megha Deshmukh',
      fatherMobile: '9673966580',
      motherMobile: '8208466635',
      fatherEmail: 'vaibhav.deshmukh@sunoiakids.com',
      program: 'SUNOIA Senior',
      term1Amount: 27000,
      term2Amount: 23000,
      paidAmount: 27000,
    },
  ];

  for (const s of sampleStudents) {
    const program = programs.find((p) => p.name === s.program) || programs[0];
    const batch = await prisma.batch.findFirst({
      where: { programId: program.id, schoolId: school.id, timeSlot: 'Morning Shift' },
    });

    const parent = await prisma.parent.create({
      data: {
        fatherName: s.fatherName,
        motherName: s.motherName,
        fatherMobile: s.fatherMobile,
        motherMobile: s.motherMobile,
        fatherEmail: s.fatherEmail,
        fatherOccupation: 'Business / Service',
      },
    });

    const student = await prisma.student.upsert({
      where: { uin: s.uin },
      update: {
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        dateOfBirth: s.dob,
        gender: s.gender,
        parentId: parent.id,
      },
      create: {
        uin: s.uin,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        dateOfBirth: s.dob,
        gender: s.gender,
        parentId: parent.id,
        address: 'Dhule, Maharashtra',
        city: 'Dhule',
        state: 'Maharashtra',
        postalCode: '424002',
        country: 'India',
      },
    });

    const existingAdm = await prisma.admission.findFirst({
      where: { studentId: student.id, academicYearId: ay2627.id },
    });

    if (!existingAdm) {
      const admission = await prisma.admission.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          academicYearId: ay2627.id,
          programId: program.id,
          batchId: batch?.id,
          admissionDate: new Date('2026-04-01'),
          status: 'ACTIVE',
          type: 'OFFLINE',
        },
      });

      const totalAmount = s.term1Amount + s.term2Amount;
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: s.uin,
          admissionId: admission.id,
          term1Amount: s.term1Amount,
          term2Amount: s.term2Amount,
          totalAmount,
          discountAmount: 0,
          netAmount: totalAmount,
          status: s.paidAmount >= totalAmount ? 'PAID' : s.paidAmount > 0 ? 'PARTIALLY_PAID' : 'GENERATED',
        },
      });

      if (s.paidAmount > 0) {
        await prisma.receipt.create({
          data: {
            receiptNumber: `REC-${s.uin.replace(/[^0-9]/g, '').slice(-4)}-1`,
            admissionId: admission.id,
            invoiceId: invoice.id,
            receiptDate: new Date('2026-04-05'),
            amount: s.paidAmount,
            paymentMode: 'CASH',
            notes: 'Advance Receipt - Term 1',
          },
        });
      }
    }
  }

  console.log('✅ Core sample students and admissions created with standard UINs');

  // ── Sample Enquiries ───────────────────────────────────────
  const sampleEnquiries = [
    { name: 'Aarav Sharma', parent: 'Rajesh Sharma', mobile: '9876543001', program: 'Play Group', uin: 'SNK/3201/0007/2027' },
    { name: 'Ananya Patel', parent: 'Vikram Patel', mobile: '9876543002', program: 'Nursery', uin: 'SNK/3201/0008/2027' },
    { name: 'Vivaan Gupta', parent: 'Arun Gupta', mobile: '9876543003', program: 'SUNOIA Junior', uin: 'SNK/3201/0009/2027' },
    { name: 'Diya Singh', parent: 'Priya Singh', mobile: '9876543004', program: 'SUNOIA Senior', uin: 'SNK/3201/0010/2027' },
    { name: 'Arjun Reddy', parent: 'Suresh Reddy', mobile: '9876543005', program: 'Play Group', uin: 'SNK/3201/0011/2027' },
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
          uin: eq.uin,
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
          enquirerAddress: 'Sample Address, Dhule',
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
