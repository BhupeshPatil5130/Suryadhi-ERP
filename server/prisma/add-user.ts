import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';



const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('No school found in DB');
    return;
  }

  await prisma.school.update({
    where: { id: school.id },
    data: { name: 'SEMS-Yavatmal-Arni', code: 'SEMS-Yavatmal-Arni' }
  });

  const passwordHash = await bcrypt.hash('Sunoia@7474', 12);

  const user = await prisma.user.upsert({
    where: { username: 'Rahul.Khandale' },
    update: {
      passwordHash,
      schoolId: school.id,
      role: 'SCHOOL_ADMIN',
    },
    create: {
      username: 'Rahul.Khandale',
      email: 'rahul.khandale@sems.suryadhi.in',
      passwordHash,
      firstName: 'Rahul',
      lastName: 'Khandale',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });

  console.log(`✅ Created/Updated user: ${user.username} with password 'Sunoia@7474' and linked to school ${school.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
