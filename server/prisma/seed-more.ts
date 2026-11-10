

// async function main() {
//   console.log('🌱 Seeding extended dummy data for ERP...');

//   const school = await prisma.school.findFirst();
//   if (!school) {
//     console.error('No school found in DB, run base seed first.');
//     return;
//   }

//   const ay = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
//   if (!ay) return;

//   const programs = await prisma.program.findMany();
//   const mediaSources = await prisma.mediaSource.findMany();

//   // Create 50 more students and admissions
//   const lastNames = ['Kulkarni', 'Deshmukh', 'Joshi', 'Patil', 'Pawar', 'Gaikwad', 'Shinde', 'Rao', 'Iyer', 'Menon'];
//   const firstNames = ['Aarohi', 'Advait', 'Ananya', 'Atharv', 'Avni', 'Ayush', 'Diya', 'Dhruv', 'Isha', 'Ishaan', 'Kavya', 'Kabir', 'Kiara', 'Kian', 'Myra', 'Mohit', 'Navya', 'Neil', 'Niya', 'Nirvaan', 'Ojas', 'Pari', 'Pranav', 'Riya', 'Rohan', 'Saisha', 'Samar', 'Siya', 'Shaurya', 'Tara', 'Vihaan', 'Zara', 'Zayn'];

//   console.log('Generating students and admissions...');
//   for (let i = 0; i < 50; i++) {
//     const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
//     const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
//     const program = programs[Math.floor(Math.random() * programs.length)];
//     const source = mediaSources[Math.floor(Math.random() * mediaSources.length)];

//     const student = await prisma.student.create({
//       data: {
//         firstName: fn,
//         lastName: ln,
//         dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 3 - Math.floor(Math.random() * 3))),
//         gender: Math.random() > 0.5 ? 'BOY' : 'GIRL',
//         uin: `SNK/3201/${String(i + 1).padStart(4, '0')}/2027`,
//       }
//     });

//     const isAdmitted = Math.random() > 0.4;

//     // Create Enquiry
//     await prisma.enquiry.create({
//       data: {
//         enquirerName: `Parent of ${fn}`,
//         enquirerMobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
//         stage: isAdmitted ? 'CONVERTED' : 'NEW',
//         studentId: student.id,
//         programId: program.id,
//         mediaSourceId: source.id,
//         academicYearId: ay.id,
//         schoolId: school.id,
//       }
//     });

//     if (isAdmitted) {
//       // Determine status
//       let status: any = 'ACTIVE';
//       const r = Math.random();
//       if (r < 0.05) status = 'TRANSFERRED_OUT';
//       else if (r < 0.1) status = 'QUIT';

//       const adm = await prisma.admission.create({
//         data: {
//           studentId: student.id,
//           schoolId: school.id,
//           academicYearId: ay.id,
//           programId: program.id,
//           status,
//           admissionDate: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 100))),
//         }
//       });

//       // Generate invoices and receipts
//       const invoice = await prisma.invoice.create({
//         data: {
//           admissionId: adm.id,
//           invoiceNumber: `INV-${adm.id}`,
//           term1Amount: 20000,
//           term2Amount: 20000,
//           totalAmount: 40000,
//           discountAmount: 0,
//           netAmount: 40000,
//           status: 'PARTIALLY_PAID',
//         }
//       });

//       // Receipt 1
//       await prisma.receipt.create({
//         data: {
//           admissionId: adm.id,
//           invoiceId: invoice.id,
//           receiptNumber: `REC-${adm.id}-1`,
//           receiptDate: new Date(),
//           amount: 20000,
//           paymentMode: 'CHEQUE',
//           chequeNumber: `CHQ-${Math.floor(1000 + Math.random() * 9000)}`,
//             transferToSchoolName: 'SUNOIA Mumbai Centre',
//             transferDate: new Date(),
//           }
//         });
//       }

//       if (status === 'QUIT') {
//         await prisma.admission.update({
//           where: { id: adm.id },
//           data: {
//             quitReason: 'Relocation',
//             quitDate: new Date(),
//           }
//         });
//       }
//     }
//   }

//   console.log('✅ Extended seed completed successfully!');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient } from '@prisma/client';

// Environment variables loaded from .env

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding extended dummy data for ERP...');

  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('❌ No school found in DB, run base seed first.');
    return;
  }

  const ay = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!ay) {
    console.error('❌ No current academic year found.');
    return;
  }

  const programs = await prisma.program.findMany();
  if (programs.length === 0) {
    console.error('❌ No programs found in DB.');
    return;
  }

  const mediaSources = await prisma.mediaSource.findMany();
  if (mediaSources.length === 0) {
    console.error('❌ No media sources found in DB.');
    return;
  }

  // Create 50 more students and admissions
  const lastNames = ['Kulkarni', 'Deshmukh', 'Joshi', 'Patil', 'Pawar', 'Gaikwad', 'Shinde', 'Rao', 'Iyer', 'Menon'];
  const firstNames = ['Aarohi', 'Advait', 'Ananya', 'Atharv', 'Avni', 'Ayush', 'Diya', 'Dhruv', 'Isha', 'Ishaan', 'Kavya', 'Kabir', 'Kiara', 'Kian', 'Myra', 'Mohit', 'Navya', 'Neil', 'Niya', 'Nirvaan', 'Ojas', 'Pari', 'Pranav', 'Riya', 'Rohan', 'Saisha', 'Samar', 'Siya', 'Shaurya', 'Tara', 'Vihaan', 'Zara', 'Zayn'];

  console.log('📚 Generating students and admissions...');

  for (let i = 0; i < 50; i++) {
    try {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const program = programs[Math.floor(Math.random() * programs.length)];
      const source = mediaSources[Math.floor(Math.random() * mediaSources.length)];

      // Generate a more realistic date of birth (3-6 years old)
      const birthYear = new Date().getFullYear() - 3 - Math.floor(Math.random() * 3);
      const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

      const student = await prisma.student.create({
        data: {
          firstName: fn,
          lastName: ln,
          dateOfBirth: birthDate,
          gender: Math.random() > 0.5 ? 'BOY' : 'GIRL',
          uin: `UIN${String(Math.floor(10000 + Math.random() * 90000)).padStart(5, '0')}`,
        }
      });

      const isAdmitted = Math.random() > 0.4;

      // Create Enquiry
      await prisma.enquiry.create({
        data: {
          enquirerName: `Parent of ${fn} ${ln}`,
          enquirerMobile: `9${String(Math.floor(100000000 + Math.random() * 900000000)).padStart(9, '0')}`,
          stage: isAdmitted ? 'CONVERTED' : 'NEW',
          studentId: student.id,
          programId: program.id,
          mediaSourceId: source.id,
          academicYearId: ay.id,
          schoolId: school.id,
        }
      });

      if (isAdmitted) {
        // Determine status - use proper enum values
        let status: 'ACTIVE' | 'TRANSFERRED_OUT' | 'QUIT' = 'ACTIVE';
        const r = Math.random();
        if (r < 0.05) status = 'TRANSFERRED_OUT';
        else if (r < 0.1) status = 'QUIT';

        // Generate admission date (within last 100 days)
        const admissionDate = new Date();
        admissionDate.setDate(admissionDate.getDate() - Math.floor(Math.random() * 100));

        const adm = await prisma.admission.create({
          data: {
            studentId: student.id,
            schoolId: school.id,
            academicYearId: ay.id,
            programId: program.id,
            status,
            admissionDate: admissionDate,
          }
        });

        // Generate invoices and receipts with realistic amounts
        const term1Amount = 18000 + Math.floor(Math.random() * 4000);
        const term2Amount = 18000 + Math.floor(Math.random() * 4000);
        const totalAmount = term1Amount + term2Amount;
        const discountAmount = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0;
        const netAmount = totalAmount - discountAmount;

        const invoice = await prisma.invoice.create({
          data: {
            admissionId: adm.id,
            invoiceNumber: `INV-${String(adm.id).padStart(6, '0')}`,
            term1Amount: term1Amount,
            term2Amount: term2Amount,
            totalAmount: totalAmount,
            discountAmount: discountAmount,
            netAmount: netAmount,
            status: 'PARTIALLY_PAID',
          }
        });

        // Receipt 1 - always create one for admitted students
        const receiptDate = new Date();
        receiptDate.setDate(receiptDate.getDate() - Math.floor(Math.random() * 30));

        await prisma.receipt.create({
          data: {
            admissionId: adm.id,
            invoiceId: invoice.id,
            receiptNumber: `REC-${String(adm.id).padStart(6, '0')}-1`,
            receiptDate: receiptDate,
            amount: Math.floor(term1Amount * 0.5 + Math.random() * 5000),
            paymentMode: ['CHEQUE', 'CASH', 'ONLINE', 'DD'][Math.floor(Math.random() * 4)],
            chequeNumber: Math.random() > 0.5 ? `CHQ-${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}` : null,
            chequeDate: Math.random() > 0.5 ? new Date() : null,
            bankName: Math.random() > 0.5 ? ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'][Math.floor(Math.random() * 4)] : null,
            bankBranch: Math.random() > 0.5 ? ['Pune', 'Mumbai', 'Delhi', 'Bangalore'][Math.floor(Math.random() * 4)] : null,
          }
        });


        // Handle special statuses
        if (status === 'TRANSFERRED_OUT') {
          await prisma.admission.update({
            where: { id: adm.id },
            data: {
              transferToSchoolName: ['SUNOIA Mumbai Centre', 'Kidzee Pune', 'Little Millennium Bangalore'][Math.floor(Math.random() * 3)],
              transferDate: new Date(),
            }
          });
        }

        if (status === 'QUIT') {
          await prisma.admission.update({
            where: { id: adm.id },
            data: {
              quitReason: ['Relocation', 'Better school found', 'Financial reasons', 'Personal reasons'][Math.floor(Math.random() * 4)],
              quitDate: new Date(),
            }
          });
        }
      }

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Processed ${i + 1}/50 students`);
      }

    } catch (error) {
      console.error(`❌ Error processing student ${i + 1}:`, error);
      // Continue with next student instead of failing the entire seed
      continue;
    }
  }

  console.log('✅ Extended seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });