import apiClient from '@/lib/api-client';

export interface SettingEntry {
  key: string;
  value: string;
  scope: 'GLOBAL' | 'SCHOOL';
  schoolId?: string | null;
  description?: string | null;
}

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

export const DEFAULT_SETTINGS: Record<string, { label: string; defaultValue: string; category: string; description: string; type: 'number' | 'boolean' | 'string' }> = {
  [SettingKey.FEE_LATE_FEE_PERCENT]: {
    label: 'Late Fee Percentage (%)',
    defaultValue: '5',
    category: 'Fees & Billing',
    description: 'Percentage penalty added to overdue fee instalments.',
    type: 'number',
  },
  [SettingKey.FEE_GRACE_PERIOD_DAYS]: {
    label: 'Fee Grace Period (Days)',
    defaultValue: '10',
    category: 'Fees & Billing',
    description: 'Number of calendar days after due date before late fee applies.',
    type: 'number',
  },
  [SettingKey.ADMISSION_FORM_FEE]: {
    label: 'Admission Application Form Fee (₹)',
    defaultValue: '500',
    category: 'Admissions & Batches',
    description: 'Standard fee charged for new admission inquiry and registration forms.',
    type: 'number',
  },
  [SettingKey.ADMISSION_MAX_STUDENTS_PER_BATCH]: {
    label: 'Max Students Per Batch',
    defaultValue: '30',
    category: 'Admissions & Batches',
    description: 'Capacity threshold per classroom / batch before requiring an overflow section.',
    type: 'number',
  },
  [SettingKey.NOTIFICATION_EMAIL_ENABLED]: {
    label: 'Automated Email Notifications',
    defaultValue: 'true',
    category: 'Notifications',
    description: 'Enable email alerts for fee receipts, admission confirmations, and attendance.',
    type: 'boolean',
  },
  [SettingKey.NOTIFICATION_SMS_ENABLED]: {
    label: 'Automated SMS / WhatsApp Alerts',
    defaultValue: 'true',
    category: 'Notifications',
    description: 'Enable SMS or WhatsApp notifications for urgent parent updates.',
    type: 'boolean',
  },
  [SettingKey.SCHOOL_LOGO_URL]: {
    label: 'Custom School Logo URL',
    defaultValue: '',
    category: 'School Branding',
    description: 'Direct HTTPS URL for report cards, receipts, and portal header display.',
    type: 'string',
  },
  [SettingKey.SCHOOL_PRIMARY_COLOR]: {
    label: 'Brand Primary Accent Color',
    defaultValue: '#2563eb',
    category: 'School Branding',
    description: 'Hex color code used across branded student receipts and invoice headers.',
    type: 'string',
  },
  [SettingKey.SESSION_MAX_DEVICES]: {
    label: 'Max Concurrent Devices per User',
    defaultValue: '3',
    category: 'Security & Access',
    description: 'Maximum active user sessions allowed simultaneously before invalidating older tokens.',
    type: 'number',
  },
  [SettingKey.PASSWORD_MIN_LENGTH]: {
    label: 'Minimum Password Length',
    defaultValue: '8',
    category: 'Security & Access',
    description: 'Minimum characters required when setting or updating account passwords.',
    type: 'number',
  },
};

export const settingsApi = {
  /** List all settings visible to current school context */
  async list(): Promise<SettingEntry[]> {
    const res = await apiClient.get('/settings');
    return res.data?.data || [];
  },

  /** Upsert a single setting by key */
  async set(key: string, value: string, description?: string): Promise<SettingEntry> {
    const res = await apiClient.put(`/settings/${encodeURIComponent(key)}`, { value, description });
    return res.data?.data;
  },

  /** Upsert multiple settings atomically */
  async bulkSet(settings: Array<{ key: string; value: string; description?: string }>): Promise<SettingEntry[]> {
    const res = await apiClient.put('/settings/bulk', { settings });
    return res.data?.data || [];
  },

  /** Delete a setting key */
  async delete(key: string): Promise<void> {
    await apiClient.delete(`/settings/${encodeURIComponent(key)}`);
  },
};

export default settingsApi;
