/**
 * Migration Script: user-profiles.json → User.profileData (JSONB)
 * 
 * Run once after deploying the updated auth/service.ts to migrate any
 * existing extended profile data from the flat JSON file into the database.
 * 
 * Usage:
 *   npx tsx src/scripts/migrate-user-profiles.ts
 */

// Auto-derive DIRECT_URL for Neon if not set
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL.replace('-pooler.', '.');
}

import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

const PROFILES_FILE_PATH = path.join(__dirname, '../data/user-profiles.json');

async function migrate() {
  if (!fs.existsSync(PROFILES_FILE_PATH)) {
    console.log('✅ No user-profiles.json found. Nothing to migrate.');
    return;
  }

  const content = fs.readFileSync(PROFILES_FILE_PATH, 'utf-8');
  const profiles: Record<string, any> = JSON.parse(content || '{}');

  const userIds = Object.keys(profiles);
  if (userIds.length === 0) {
    console.log('✅ user-profiles.json is empty. Nothing to migrate.');
    return;
  }

  console.log(`📂 Found ${userIds.length} user profiles to migrate...`);
  let migrated = 0;
  let skipped = 0;

  for (const userId of userIds) {
    const profileData = profiles[userId];

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`  ⚠️  User ${userId} not found in DB — skipping.`);
      skipped++;
      continue;
    }

    // Skip if profileData already populated (avoid overwriting newer data)
    if (user.profileData && Object.keys(user.profileData as any).length > 0) {
      console.log(`  ⏭️  User ${userId} already has profileData — skipping.`);
      skipped++;
      continue;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profileData },
    });

    console.log(`  ✅ Migrated profile for user: ${user.email} (${userId})`);
    migrated++;
  }

  console.log(`\n🎉 Migration complete: ${migrated} migrated, ${skipped} skipped.`);

  // Rename the file to mark it as migrated (don't delete in case of rollback)
  const backupPath = PROFILES_FILE_PATH + '.migrated';
  fs.renameSync(PROFILES_FILE_PATH, backupPath);
  console.log(`📦 Original file renamed to: ${backupPath}`);

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
