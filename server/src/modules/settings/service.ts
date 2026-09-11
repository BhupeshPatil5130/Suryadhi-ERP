import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export type SettingScope = 'GLOBAL' | 'SCHOOL';

export interface SettingEntry {
  key: string;
  value: string;
  scope: SettingScope;
  schoolId?: string | null;
  description?: string | null;
}

/** Well-known setting keys — add new constants here instead of hardcoding values in business logic. */
export const SettingKey = {
  // Fees
  FEE_LATE_FEE_PERCENT: 'fee.late_fee_percent',
  FEE_GRACE_PERIOD_DAYS: 'fee.grace_period_days',
  // Admissions
  ADMISSION_FORM_FEE: 'admission.form_fee',
  ADMISSION_MAX_STUDENTS_PER_BATCH: 'admission.max_students_per_batch',
  // Notifications
  NOTIFICATION_EMAIL_ENABLED: 'notification.email_enabled',
  NOTIFICATION_SMS_ENABLED: 'notification.sms_enabled',
  // UI / Branding
  SCHOOL_LOGO_URL: 'school.logo_url',
  SCHOOL_PRIMARY_COLOR: 'school.primary_color',
  // Security
  SESSION_MAX_DEVICES: 'security.session_max_devices',
  PASSWORD_MIN_LENGTH: 'security.password_min_length',
} as const;

export class SettingsService {
  /**
   * Read a single setting value.
   * Precedence: school-scoped setting → global setting → defaultValue
   */
  async get(key: string, schoolId?: string | null, defaultValue?: string): Promise<string | undefined> {
    // Prefer school-scoped setting, fall back to global (schoolId = null)
    if (schoolId) {
      const scoped = await prisma.systemSetting.findUnique({
        where: { key_schoolId: { key, schoolId } },
      });
      if (scoped) return scoped.value;
    }

    // Fall back to global setting
    const global = await prisma.systemSetting.findUnique({
      where: { key_schoolId: { key, schoolId: null } },
    });

    return global?.value ?? defaultValue;
  }

  /**
   * Read a setting and coerce to a typed value.
   * Falls back to defaultValue if the key does not exist.
   */
  async getTyped<T extends string | number | boolean>(
    key: string,
    type: 'string' | 'number' | 'boolean',
    schoolId?: string | null,
    defaultValue?: T
  ): Promise<T | undefined> {
    const raw = await this.get(key, schoolId, defaultValue?.toString());
    if (raw === undefined) return defaultValue;
    if (type === 'number') return Number(raw) as T;
    if (type === 'boolean') return (raw === 'true' || raw === '1') as unknown as T;
    return raw as T;
  }

  /**
   * List all settings visible to a school (school-scoped + global).
   */
  async list(schoolId?: string | null): Promise<SettingEntry[]> {
    const where = schoolId
      ? { OR: [{ schoolId }, { schoolId: null }] }
      : { schoolId: null as null }; // SUPER_ADMIN with no filter: global only unless they pass schoolId explicitly

    const rows = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ key: 'asc' }],
    });

    return rows.map((r) => ({
      key: r.key,
      value: r.value,
      scope: r.schoolId ? 'SCHOOL' as const : 'GLOBAL' as const,
      schoolId: r.schoolId,
      description: r.description,
    }));
  }

  /**
   * Upsert a single setting.
   * Only SUPER_ADMIN may write global settings (schoolId = null).
   */
  async set(key: string, value: string, schoolId?: string | null, description?: string): Promise<SettingEntry> {
    const row = await prisma.systemSetting.upsert({
      where: {
        key_schoolId: {
          key,
          schoolId: schoolId ?? null,
        },
      },
      update: { value, ...(description ? { description } : {}) },
      create: { key, value, schoolId: schoolId ?? null, description },
    });

    return {
      key: row.key,
      value: row.value,
      scope: row.schoolId ? 'SCHOOL' : 'GLOBAL',
      schoolId: row.schoolId,
      description: row.description,
    };
  }

  /**
   * Bulk upsert — replaces all provided settings atomically.
   */
  async bulkSet(
    entries: Array<{ key: string; value: string; description?: string }>,
    schoolId?: string | null
  ): Promise<SettingEntry[]> {
    const results = await prisma.$transaction(
      entries.map((e) =>
        prisma.systemSetting.upsert({
          where: { key_schoolId: { key: e.key, schoolId: schoolId ?? null } },
          update: { value: e.value, ...(e.description ? { description: e.description } : {}) },
          create: { key: e.key, value: e.value, schoolId: schoolId ?? null, description: e.description },
        })
      )
    );

    return results.map((r) => ({
      key: r.key,
      value: r.value,
      scope: r.schoolId ? 'SCHOOL' : 'GLOBAL',
      schoolId: r.schoolId,
      description: r.description,
    }));
  }

  /**
   * Delete a setting. Only SUPER_ADMIN may delete global settings.
   */
  async delete(key: string, schoolId?: string | null): Promise<void> {
    const existing = await prisma.systemSetting.findUnique({
      where: { key_schoolId: { key, schoolId: schoolId ?? null } },
    });
    if (!existing) throw new AppError(`Setting '${key}' not found`, 404);

    await prisma.systemSetting.delete({
      where: { key_schoolId: { key, schoolId: schoolId ?? null } },
    });
  }
}

export const settingsService = new SettingsService();
