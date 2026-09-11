// ─── Route Path Constants ──────────────────────────────────
// Single source of truth for all route paths in the application.
// Usage: import { PATHS } from '@/app/routes/paths';

export const PATHS = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  MANAGE_USERS: '/manage-users',

  // ── Enquiry ────────────────────────────────────────────
  ENQUIRY: {
    LIST: '/enquiry',
    CREATE: '/enquiry/create',
    EDIT: (id = ':id') => `/enquiry/${id}/edit`,
    FOLLOW_UP: (id = ':id') => `/enquiry/${id}/follow-up`,
    CONVERT: (id = ':id') => `/enquiry/${id}/convert`,
    RECEIPTS: (id = ':id') => `/enquiry/${id}/receipts`,
    ADD_RECEIPT: (id = ':id') => `/enquiry/${id}/receipts/add`,
  },

  // ── Admission ──────────────────────────────────────────
  ADMISSION: {
    LIST: '/admission',
    EDIT: (id = ':id') => `/admissions/${id}/edit`,
    RECEIPT: (id = ':id') => `/admissions/${id}/receipt`,
    VIEW_RECEIPT: '/admissions/view-receipt',
  },

  // ── Student Lifecycle ──────────────────────────────────
  GRADUATION: {
    HOMEBUDDY: '/graduation/homebuddy',
  },
  TRANSFERS: {
    MANAGE: '/transfers/manage',
    MANAGE_STAGE: '/transfers/manage-stage',
    REQUESTS: '/transfers/requests',
    OUT: '/transfer-out',
  },
  QUIT: {
    ADMISSION: '/quit-admission',
    MANAGE: '/quit-admission-manage',
  },
  NAME_CHANGE: {
    REQUEST: '/name-change',
    CONFIRM: '/name-change-confirm',
  },

  // ── Enrollment Dashboards ──────────────────────────────
  ENROLLMENT: {
    SUMMARY: '/enrollment/summary',
    SOURCE_WISE: '/enrollment/source-wise',
    RETENTION_BASE: '/enrollment/retention-base',
    RETENTION_GROWTH: '/enrollment/retention-growth',
    NEW_BUSINESS: '/enrollment/new-business',
    INVENTORY: '/inventory-details',
  },

  // ── Communications ─────────────────────────────────────
  COMMUNICATIONS: {
    BUSINESS_VISITS: '/communications/business-visits',
    ACADEMICS_VISITS: '/communications/academics-visits',
    APP_REPORT: '/communications/app-report',
  },

  // ── Fees & Finance ─────────────────────────────────────
  FEES: {
    ADD_RECEIPT: '/fees/add-receipt',
    DEPOSIT: '/fees/deposit',
    CASH_TO_CHEQUE: '/fees/cash-to-cheque',
    CASH_TO_ONLINE: '/fees/cash-to-online',
    DEPOSIT_HISTORY: '/fees/deposit-history',
    FUNDS_TRANSFER: '/fees/funds-transfer',
    HOMEBUDDY: '/fees/homebuddy',
    ONLINE_PAYMENTS: '/fees/online-payments',
  },
  SOA: {
    SUMMARY: '/soa/summary',
    DETAILS: '/soa/details',
  },

  // ── Operations ─────────────────────────────────────────
  OPERATIONS: {
    PROGRAM_CHANGE: '/program-change',
    PURCHASE: '/operations/purchase',
    EXCHANGE: '/operations/exchange',
    SHORTAGE_REPORT: '/shortage/report',
    SHORTAGE_DOWNLOAD: '/shortage/download',
  },

  // ── Franchisee ─────────────────────────────────────────
  FRANCHISEE: {
    INVOICES: '/franchisee/invoices',
    ROYALTY_FORECAST: '/franchisee/royalty-forecast',
    INVOICE_DOWNLOAD: '/franchisee/invoice-download',
    RECEIPT_DOWNLOAD: '/franchisee/receipt-download',
    COACH_LIST: '/franchisee/coach-list',
  },

  // ── Reports ────────────────────────────────────────────
  REPORTS: {
    ADMISSIONS: '/reports/admissions',
    FEE_CARD: '/reports/fee-card',
    ENQUIRIES: '/reports/enquiries',
    LSQ_ENQUIRIES: '/reports/lsq-enquiries',
    PAYMENT_DUE: '/reports/payment-due',
    CANCELLED_RECEIPTS: '/reports/cancelled-receipts',
    TRANSFERS: '/reports/transfers',
    FCR: '/reports/fcr',
    ADMISSION_COUNT: '/reports/admission-count',
    ONLINE_PAYMENTS: '/reports/online-payments',
    ROYALTY_FORECAST: '/reports/royalty-forecast',
  },

  // ── Tools & Support ────────────────────────────────────
  TOOLS: {
    FEE_CALCULATOR: '/tools/fee-calculator',
  },
  SUPPORT: '/support',
  VIDEO_LIBRARY: '/video-library',

  // ── Settings / Admin ────────────────────────────
  SETTINGS: {
    SYSTEM: '/settings/system',
    ACADEMIC_YEARS: '/settings/academic-years',
  },
} as const;
