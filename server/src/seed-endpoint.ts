import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

router.get('/trigger-seed', async (req: Request, res: Response) => {
  const allowSeed = process.env.ALLOW_RUNTIME_SEED === 'true';
  const seedToken = process.env.SEED_MAINTENANCE_TOKEN;
  const providedToken = req.headers['x-seed-token'] || req.query.token;

  if (process.env.NODE_ENV === 'production' || !allowSeed || !seedToken || providedToken !== seedToken) {
    return res.status(403).json({ success: false, error: 'Runtime seeding is disabled or maintenance token invalid' });
  }

  try {
    console.log('🌱 Triggering seed from endpoint...');
    
    // ── Academic Years ─────────────────────────────────────────
    const ay2627 = await prisma.academicYear.upsert({
      where: { label: 'Apr 26 - Mar 27' },
      update: {},
      create: { label: 'Apr 26 - Mar 27', startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31'), isCurrent: true }
    });

    // ── Programs ───────────────────────────────────────────────
    // Delete old Euro Junior and Euro Senior duplicates if present
    try {
      await prisma.program.deleteMany({ where: { name: { in: ['Euro Junior', 'Euro Senior'] } } });
      console.log('🗑️ Deleted old Euro Junior / Euro Senior program entries');
    } catch (e) {
      console.warn('Could not delete old programs (may not exist or have references):', e);
    }

    const programs = await Promise.all([
      prisma.program.upsert({ where: { name: 'Play Group' }, update: { shortName: 'PG', sortOrder: 1 }, create: { name: 'Play Group', shortName: 'PG', ageFrom: 18, ageTo: 30, sortOrder: 1 } }),
      prisma.program.upsert({ where: { name: 'Nursery' }, update: { shortName: 'NR', sortOrder: 2 }, create: { name: 'Nursery', shortName: 'NR', ageFrom: 30, ageTo: 42, sortOrder: 2 } }),
      prisma.program.upsert({ where: { name: 'SUNOIA Junior' }, update: { shortName: 'SJ', sortOrder: 3 }, create: { name: 'SUNOIA Junior', shortName: 'SJ', ageFrom: 42, ageTo: 54, sortOrder: 3 } }),
      prisma.program.upsert({ where: { name: 'SUNOIA Senior' }, update: { shortName: 'SS', sortOrder: 4 }, create: { name: 'SUNOIA Senior', shortName: 'SS', ageFrom: 54, ageTo: 72, sortOrder: 4 } }),
    ]);

    // ── Media Sources ──────────────────────────────────────────
    const sourceNames = ['Walk-in', 'Referral', 'Social Media', 'Website', 'Newspaper Ad', 'Hoarding / Banner', 'School Event', 'Online Campaign', 'Pamphlet', 'Other'];
    const dbSources = [];
    for (const name of sourceNames) {
      const src = await prisma.mediaSource.upsert({ where: { name }, update: {}, create: { name } });
      dbSources.push(src);
    }

    // ── School ─────────────────────────────────────────────────
    const school = await prisma.school.upsert({
      where: { code: 'EK-DEMO-001' },
      update: {},
      create: { code: 'SL-DEMO-001', name: 'SŪNOIAKIDS™ Demo Pre-School', address: '123 Education Lane, Sector 5', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India', email: 'demo@suryadhi.local', phone: '9876543210' }
    });

    await prisma.schoolAcademicYear.upsert({
      where: { schoolId_academicYearId: { schoolId: school.id, academicYearId: ay2627.id } },
      update: {},
      create: { schoolId: school.id, academicYearId: ay2627.id }
    });

    // ── Batches ────────────────────────────────────────────────
    for (const program of programs) {
      const batchTimes = ['Early Morning Shift', 'Late Morning Shift'];
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

    // ── Fee Structures ─────────────────────────────────────────
    const feeData = [
      { program: 'Play Group', registration: 5000, termFee: 15000, tuitionFee: 10000 },
      { program: 'Nursery', registration: 5000, termFee: 18000, tuitionFee: 12000 },
      { program: 'SUNOIA Junior', registration: 5000, termFee: 20000, tuitionFee: 14000 },
      { program: 'SUNOIA Senior', registration: 5000, termFee: 22000, tuitionFee: 16000 },
    ];
    for (const fee of feeData) {
      const program = programs.find((p: any) => p.name === fee.program)!;
      const feeEntries = [
        { feeType: 'REGISTRATION' as const, term1: fee.registration, term2: 0 },
        { feeType: 'TERM_FEE' as const, term1: fee.termFee, term2: fee.termFee },
        { feeType: 'TUITION_FEE' as const, term1: fee.tuitionFee, term2: fee.tuitionFee },
      ];
      for (const entry of feeEntries) {
        await prisma.feeStructure.upsert({
          where: { programId_academicYearId_schoolId_feeType: { programId: program.id, academicYearId: ay2627.id, schoolId: school.id, feeType: entry.feeType } },
          update: {},
          create: { programId: program.id, academicYearId: ay2627.id, schoolId: school.id, feeType: entry.feeType, term1Amount: entry.term1, term2Amount: entry.term2, totalAmount: entry.term1 + entry.term2 },
        });
      }
    }

    // ── Discount Types ─────────────────────────────────────────
    const discounts = [
      { name: 'Sibling Discount', percentage: 10 },
      { name: 'Early Bird Discount', percentage: 5 },
      { name: 'Staff Discount', percentage: 15 },
    ];
    for (const disc of discounts) {
      const existing = await prisma.discountType.findFirst({ where: { name: disc.name, schoolId: school.id } });
      if (!existing) {
        await prisma.discountType.create({ data: { name: disc.name, percentage: disc.percentage, schoolId: school.id } });
      }
    }

    // ── Users ──────────────────────────────────────────────────
    const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMeImmediately@2026';
    const passwordHash = await bcrypt.hash(seedAdminPassword, 12);
    await prisma.user.upsert({
      where: { username: 'Rahul.Khandale' },
      update: { passwordHash, schoolId: school.id },
      create: { username: 'Rahul.Khandale', email: 'rahul.khandale@sems.suryadhi.in', passwordHash, firstName: 'Rahul', lastName: 'Khandale', role: 'SUPER_ADMIN', schoolId: school.id }
    });

    const adminHash = await bcrypt.hash(seedAdminPassword, 12);
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: { passwordHash: adminHash, schoolId: school.id },
      create: { username: 'admin', email: 'admin@sems.suryadhi.in', passwordHash: adminHash, firstName: 'System', lastName: 'Admin', role: 'SUPER_ADMIN', schoolId: school.id }
    });

    // ── Extended Dummy Data ────────────────────────────────────
    const lastNames = ['Kulkarni', 'Deshmukh', 'Joshi', 'Patil', 'Pawar', 'Gaikwad', 'Shinde', 'Rao', 'Iyer', 'Menon'];
    const firstNames = ['Aarohi', 'Advait', 'Ananya', 'Atharv', 'Avni', 'Ayush', 'Diya', 'Dhruv', 'Isha', 'Ishaan', 'Kavya', 'Kabir', 'Kiara', 'Kian', 'Myra', 'Mohit', 'Navya', 'Neil', 'Niya', 'Nirvaan'];

    const existingStudentCount = await prisma.student.count();
    const howMany = existingStudentCount > 20 ? 10 : 50; // Don't re-seed too many

    for (let i = 0; i < howMany; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const program = programs[Math.floor(Math.random() * programs.length)];
      const source = dbSources[Math.floor(Math.random() * dbSources.length)];
      
      const student = await prisma.student.create({
        data: { firstName: fn, lastName: ln, dateOfBirth: new Date(2022, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)), gender: Math.random() > 0.5 ? 'BOY' : 'GIRL' }
      });

      const isAdmitted = Math.random() > 0.4;
      
      // Create Enquiry
      await prisma.enquiry.create({
        data: {
          enquirerName: `Parent of ${fn}`,
          enquirerMobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          stage: isAdmitted ? 'CONVERTED' : 'NEW',
          studentId: student.id,
          programId: program.id,
          mediaSourceId: source.id,
          academicYearId: ay2627.id,
          schoolId: school.id,
        }
      });

      if (isAdmitted) {
        let status: any = 'ACTIVE';
        const r = Math.random();
        if (r < 0.05) status = 'TRANSFERRED_OUT';
        else if (r < 0.1) status = 'QUIT';

        const adm = await prisma.admission.create({
          data: {
            studentId: student.id,
            schoolId: school.id,
            academicYearId: ay2627.id,
            programId: program.id,
            status,
            admissionDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 100))),
          }
        });

        // Create Invoice (matching actual schema fields)
        const term1 = 20000 + Math.floor(Math.random() * 10000);
        const term2 = 15000 + Math.floor(Math.random() * 10000);
        const total = term1 + term2;
        const net = total;

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${Date.now()}-${i}`,
            admissionId: adm.id,
            term1Amount: term1,
            term2Amount: term2,
            totalAmount: total,
            discountAmount: 0,
            netAmount: net,
            status: 'PARTIALLY_PAID',
          }
        });

        // Create Receipt (matching actual schema fields)
        const paidAmount = Math.floor(net * 0.5);
        await prisma.receipt.create({
          data: {
            receiptNumber: `REC-${Date.now()}-${i}`,
            admissionId: adm.id,
            invoiceId: invoice.id,
            receiptDate: new Date(),
            amount: paidAmount,
            paymentMode: Math.random() > 0.5 ? 'CHEQUE' : 'CASH',
            bankName: 'HDFC Bank',
            bankBranch: 'Pune',
          }
        });

        // Create SOA entries (matching actual schema fields)
        await prisma.sOAEntry.create({
          data: {
            schoolId: school.id,
            entryDate: new Date(),
            particulars: `Term Fees - ${fn} ${ln}`,
            entryType: 'FRANCHISEE_FEES',
            invoiceAmount: net,
            receiptAmount: 0,
            balance: net,
          }
        });

        await prisma.sOAEntry.create({
          data: {
            schoolId: school.id,
            entryDate: new Date(),
            particulars: `Payment Received - ${fn} ${ln}`,
            entryType: 'ADVANCE',
            invoiceAmount: 0,
            receiptAmount: paidAmount,
            balance: net - paidAmount,
          }
        });

        // Handle transfer/quit via their proper models
        if (status === 'TRANSFERRED_OUT') {
          await prisma.transferOutRequest.create({
            data: {
              admissionId: adm.id,
              fromSchoolName: school.name,
              toSchoolName: 'SUNOIA Mumbai Centre',
              transferDate: new Date(),
              status: 'APPROVED',
            }
          });
        }

        if (status === 'QUIT') {
          await prisma.quitRecord.create({
            data: {
              admissionId: adm.id,
              reason: 'Relocation',
              quitDate: new Date(),
              isDuplicate: false,
            }
          });
        }
      }
    }

    console.log('✅ Seed completed successfully!');
    res.json({ success: true, message: `Seeded ${howMany} students + admissions + invoices + receipts successfully!` });
  } catch (err: any) {
    console.error('❌ Seed error:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

export default router;
