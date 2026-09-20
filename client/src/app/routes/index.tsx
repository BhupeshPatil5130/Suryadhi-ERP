import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import PrivateRoute from './PrivateRoute';
import RootLayout from '@/layouts/RootLayout';

// ─── Lazy Loaded Features ───────────────────────────────────

// Auth & Dashboard
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'));
const ManageUsersPage = lazy(() => import('@/features/auth/pages/ManageUsersPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));

// Enquiry
const EnquiryListPage = lazy(() => import('@/features/enquiry/pages/EnquiryListPage'));
const CreateEnquiryPage = lazy(() => import('@/features/enquiry/pages/CreateEnquiryPage'));
const UpdateEnquiryPage = lazy(() => import('@/features/enquiry/pages/UpdateEnquiryPage'));
const EnquiryFollowUpPage = lazy(() => import('@/features/enquiry/pages/EnquiryFollowUpPage'));
const ConvertToAdmissionPage = lazy(() => import('@/features/enquiry/pages/ConvertToAdmissionPage'));
const ViewReceiptPage = lazy(() => import('@/features/enquiry/pages/ViewReceiptPage'));
const EnquiryAddReceiptPage = lazy(() => import('@/features/enquiry/pages/AddReceiptPage'));
const LSQEnquiryDetailsPage = lazy(() => import('@/features/enquiry/pages/LSQEnquiryDetailsPage'));

// Admission
const AdmissionListPage = lazy(() => import('@/features/admission/pages/AdmissionListPage'));
const UpdateAdmissionPage = lazy(() => import('@/features/admission/pages/UpdateAdmissionPage'));
const AdvanceReceiptFormPage = lazy(() => import('@/features/admission/pages/AdvanceReceiptFormPage'));
const QuitStudentPage = lazy(() => import('@/features/admission/pages/QuitStudentPage'));
const TransferRequestPage = lazy(() => import('@/features/admission/pages/TransferRequestPage'));
const NameDobChangePage = lazy(() => import('@/features/admission/pages/NameDobChangePage'));
const NameChangeConfirmationPage = lazy(() => import('@/features/admission/pages/NameChangeConfirmationPage'));
const ManageTransferStagePage = lazy(() => import('@/features/admission/pages/ManageTransferStagePage'));
const ManageQuitAdmissionPage = lazy(() => import('@/features/admission/pages/ManageQuitAdmissionPage'));
const GraduationHomebuddyPage = lazy(() => import('@/features/admission/pages/GraduationHomebuddyPage'));
const SchoolTransferRequestsPage = lazy(() => import('@/features/admission/pages/SchoolTransferRequestsPage'));

// Enrollment
const EnrollmentSummaryPage = lazy(() => import('@/features/enrollment/pages/EnrollmentSummaryPage'));
const SourceWiseEnquiriesPage = lazy(() => import('@/features/enrollment/pages/SourceWiseEnquiriesPage'));
const RetentionBasePage = lazy(() => import('@/features/enrollment/pages/RetentionBasePage'));
const RetentionGrowthPage = lazy(() => import('@/features/enrollment/pages/RetentionGrowthPage'));
const NewAdmissionsGrowthPage = lazy(() => import('@/features/enrollment/pages/NewAdmissionsGrowthPage'));
const InventoryDetailsPage = lazy(() => import('@/features/enrollment/pages/InventoryDetailsPage'));

// Communications
const BusinessVisitsPage = lazy(() => import('@/features/communications/pages/BusinessVisitsPage'));
const AcademicsVisitsPage = lazy(() => import('@/features/communications/pages/AcademicsVisitsPage'));
const AppReportPage = lazy(() => import('@/features/communications/pages/AppReportPage'));

// Fees & SOA
const SOASummaryPage = lazy(() => import('@/features/soa/pages/SOASummaryPage'));
const SOADetailsPage = lazy(() => import('@/features/soa/pages/SOADetailsPage'));
const DepositSlipPage = lazy(() => import('@/features/fees/pages/DepositSlipPage'));
const CashToChequePage = lazy(() => import('@/features/fees/pages/CashToChequePage'));
const CashToOnlinePage = lazy(() => import('@/features/fees/pages/CashToOnlinePage'));
const DepositHistoryPage = lazy(() => import('@/features/fees/pages/DepositHistoryPage'));
const FundsTransferPage = lazy(() => import('@/features/fees/pages/FundsTransferPage'));
const HomebuddyFeePage = lazy(() => import('@/features/fees/pages/HomebuddyFeePage'));
const OnlinePaymentsPage = lazy(() => import('@/features/fees/pages/OnlinePaymentsPage'));
const AddReceiptPage = lazy(() => import('@/features/fees/pages/AddReceiptPage'));
const PrintReceiptPage = lazy(() => import('@/features/fees/pages/PrintReceiptPage'));
const FeeCalculatorPage = lazy(() => import('@/features/fees/pages/FeeCalculatorPage'));
const FeeRateCardPage = lazy(() => import('@/features/fees/pages/FeeRateCardPage'));

// Operations
const ProgramChangePage = lazy(() => import('@/features/operations/pages/ProgramChangePage'));
const PurchaseOrderPage = lazy(() => import('@/features/operations/pages/PurchaseOrderPage'));
const ExchangeOrdersPage = lazy(() => import('@/features/operations/pages/ExchangeOrdersPage'));
const ReportShortageDamagePage = lazy(() => import('@/features/operations/pages/ReportShortageDamagePage'));

const DownloadShortageReportPage = lazy(() => import('@/features/operations/pages/DownloadShortageReportPage'));

// Franchisee
const ViewInvoicePage = lazy(() => import('@/features/franchisee/pages/ViewInvoicePage'));
const StudentForecastedRoyaltyPage = lazy(() => import('@/features/franchisee/pages/StudentForecastedRoyaltyPage'));
const InvoiceDownloadPage = lazy(() => import('@/features/franchisee/pages/InvoiceDownloadPage'));
const ReceiptDownloadPage = lazy(() => import('@/features/franchisee/pages/ReceiptDownloadPage'));
const CoachListPage = lazy(() => import('@/features/franchisee/pages/CoachListPage'));

// Support & Shared
const VideoLibraryPage = lazy(() => import('@/features/video/pages/VideoLibraryPage'));
const HelpdeskSupportPage = lazy(() => import('@/features/support/pages/HelpdeskSupportPage'));
const GenericListPage = lazy(() => import('@/features/shared/pages/GenericListPage'));
const ManageAcademicYearsPage = lazy(() => import('@/features/shared/pages/ManageAcademicYearsPage'));
const SystemSettingsPage = lazy(() => import('@/features/shared/pages/SystemSettingsPage'));
const OnlinePaymentReportPage = lazy(() => import('@/features/reports/pages/OnlinePaymentReportPage'));
const StudentForecastedRoyaltyReportPage = lazy(() => import('@/features/reports/pages/StudentForecastedRoyaltyReportPage'));
const AdmissionDetailsReportPage = lazy(() => import('@/features/reports/pages/AdmissionDetailsReportPage'));
const PaymentDueReportPage = lazy(() => import('@/features/reports/pages/PaymentDueReportPage'));
const FCRReportPage = lazy(() => import('@/features/reports/pages/FCRReportPage'));
const AdmissionCountReportPage = lazy(() => import('@/features/reports/pages/AdmissionCountReportPage'));
const EnquiryDetailsReportPage = lazy(() => import('@/features/reports/pages/EnquiryDetailsReportPage'));
const LSQReportPage = lazy(() => import('@/features/reports/pages/LSQReportPage'));
const CancelledReceiptsReportPage = lazy(() => import('@/features/reports/pages/CancelledReceiptsReportPage'));
const TransferredStudentReportPage = lazy(() => import('@/features/reports/pages/TransferredStudentReportPage'));

const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.SIGNUP} element={<SignupPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <RootLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to={PATHS.DASHBOARD} replace />} />
          <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={PATHS.PROFILE} element={<ProfilePage />} />
          <Route path={PATHS.MANAGE_USERS} element={<ManageUsersPage />} />

          {/* Enquiry */}
          <Route path={PATHS.ENQUIRY.LIST} element={<EnquiryListPage />} />
          <Route path={PATHS.ENQUIRY.CREATE} element={<CreateEnquiryPage />} />
          <Route path={PATHS.ENQUIRY.EDIT()} element={<UpdateEnquiryPage />} />
          <Route path={PATHS.ENQUIRY.FOLLOW_UP()} element={<EnquiryFollowUpPage />} />
          <Route path={PATHS.ENQUIRY.CONVERT()} element={<ConvertToAdmissionPage />} />
          <Route path={PATHS.ENQUIRY.RECEIPTS()} element={<ViewReceiptPage />} />
          <Route path={PATHS.ENQUIRY.ADD_RECEIPT()} element={<EnquiryAddReceiptPage />} />
          <Route path={PATHS.ENQUIRY.LSQ} element={<LSQEnquiryDetailsPage />} />

          {/* Admission */}
          <Route path={PATHS.ADMISSION.LIST} element={<AdmissionListPage />} />
          <Route path={PATHS.ADMISSION.EDIT()} element={<UpdateAdmissionPage />} />
          <Route path={PATHS.ADMISSION.RECEIPT()} element={<AdvanceReceiptFormPage />} />
          <Route path={PATHS.ADMISSION.VIEW_RECEIPT} element={<PrintReceiptPage />} />
          <Route path={PATHS.GRADUATION.HOMEBUDDY} element={<GraduationHomebuddyPage />} />
          <Route path={PATHS.TRANSFERS.MANAGE} element={<TransferRequestPage />} />
          <Route path={PATHS.TRANSFERS.MANAGE_STAGE} element={<ManageTransferStagePage />} />
          <Route path={PATHS.TRANSFERS.REQUESTS} element={<SchoolTransferRequestsPage />} />
          <Route path={PATHS.QUIT.ADMISSION} element={<QuitStudentPage />} />
          <Route path={PATHS.QUIT.MANAGE} element={<ManageQuitAdmissionPage />} />
          <Route path={PATHS.TRANSFERS.OUT} element={<TransferRequestPage />} />
          <Route path={PATHS.NAME_CHANGE.REQUEST} element={<NameDobChangePage />} />
          <Route path={PATHS.NAME_CHANGE.CONFIRM} element={<NameChangeConfirmationPage />} />
          <Route path={PATHS.ENROLLMENT.INVENTORY} element={<InventoryDetailsPage />} />

          {/* Dashboards */}
          <Route path={PATHS.ENROLLMENT.SUMMARY} element={<EnrollmentSummaryPage />} />
          <Route path={PATHS.ENROLLMENT.SOURCE_WISE} element={<SourceWiseEnquiriesPage />} />
          <Route path={PATHS.ENROLLMENT.RETENTION_BASE} element={<RetentionBasePage />} />
          <Route path={PATHS.ENROLLMENT.RETENTION_GROWTH} element={<RetentionGrowthPage />} />
          <Route path={PATHS.ENROLLMENT.NEW_BUSINESS} element={<NewAdmissionsGrowthPage />} />

          {/* Communications & Support */}
          <Route path={PATHS.COMMUNICATIONS.BUSINESS_VISITS} element={<BusinessVisitsPage />} />
          <Route path={PATHS.COMMUNICATIONS.ACADEMICS_VISITS} element={<AcademicsVisitsPage />} />
          <Route path={PATHS.COMMUNICATIONS.APP_REPORT} element={<AppReportPage />} />
          <Route path={PATHS.SUPPORT} element={<HelpdeskSupportPage />} />
          <Route path={PATHS.VIDEO_LIBRARY} element={<VideoLibraryPage />} />

          {/* Operations & Program Change */}
          <Route path={PATHS.OPERATIONS.PROGRAM_CHANGE} element={<ProgramChangePage />} />
          <Route path={PATHS.OPERATIONS.PURCHASE} element={<PurchaseOrderPage />} />
          <Route path={PATHS.OPERATIONS.EXCHANGE} element={<ExchangeOrdersPage />} />
          <Route path={PATHS.OPERATIONS.SHORTAGE_REPORT} element={<ReportShortageDamagePage />} />
          <Route path={PATHS.OPERATIONS.SHORTAGE_DOWNLOAD} element={<DownloadShortageReportPage />} />

          {/* Accounts & Finance */}
          <Route path={PATHS.SOA.SUMMARY} element={<SOASummaryPage />} />
          <Route path={PATHS.SOA.DETAILS} element={<SOADetailsPage />} />
          <Route path={PATHS.FEES.ADD_RECEIPT} element={<AddReceiptPage />} />
          <Route path={PATHS.FEES.DEPOSIT} element={<DepositSlipPage />} />
          <Route path={PATHS.FEES.CASH_TO_CHEQUE} element={<CashToChequePage />} />
          <Route path={PATHS.FEES.CASH_TO_ONLINE} element={<CashToOnlinePage />} />
          <Route path={PATHS.FEES.DEPOSIT_HISTORY} element={<DepositHistoryPage />} />
          <Route path={PATHS.FEES.FUNDS_TRANSFER} element={<FundsTransferPage />} />
          <Route path={PATHS.FEES.HOMEBUDDY} element={<HomebuddyFeePage />} />
          <Route path={PATHS.FEES.ONLINE_PAYMENTS} element={<OnlinePaymentsPage />} />

          {/* Franchisee */}
          <Route path={PATHS.FRANCHISEE.INVOICES} element={<ViewInvoicePage />} />
          <Route path={PATHS.FRANCHISEE.ROYALTY_FORECAST} element={<StudentForecastedRoyaltyPage />} />
          <Route path={PATHS.FRANCHISEE.INVOICE_DOWNLOAD} element={<InvoiceDownloadPage />} />
          <Route path={PATHS.FRANCHISEE.RECEIPT_DOWNLOAD} element={<ReceiptDownloadPage />} />
          <Route path={PATHS.FRANCHISEE.COACH_LIST} element={<CoachListPage />} />

          {/* Reports */}
          <Route path={PATHS.REPORTS.ADMISSIONS} element={<AdmissionDetailsReportPage />} />
          <Route path={PATHS.REPORTS.FEE_CARD} element={<FeeRateCardPage />} />
          <Route path={PATHS.REPORTS.ENQUIRIES} element={<EnquiryDetailsReportPage />} />
          <Route path={PATHS.REPORTS.LSQ_ENQUIRIES} element={<LSQReportPage />} />
          <Route path={PATHS.REPORTS.PAYMENT_DUE} element={<PaymentDueReportPage />} />
          <Route path={PATHS.REPORTS.CANCELLED_RECEIPTS} element={<CancelledReceiptsReportPage />} />
          <Route path={PATHS.REPORTS.TRANSFERS} element={<TransferredStudentReportPage />} />
          <Route path={PATHS.REPORTS.FCR} element={<FCRReportPage />} />
          <Route path={PATHS.REPORTS.ADMISSION_COUNT} element={<AdmissionCountReportPage />} />
          <Route path={PATHS.REPORTS.ONLINE_PAYMENTS} element={<OnlinePaymentReportPage />} />
          <Route path={PATHS.REPORTS.ROYALTY_FORECAST} element={<StudentForecastedRoyaltyReportPage />} />

          {/* Tools */}
          <Route path={PATHS.TOOLS.FEE_CALCULATOR} element={<FeeCalculatorPage />} />

          {/* Settings / Admin */}
          <Route path={PATHS.SETTINGS.SYSTEM} element={<SystemSettingsPage />} />
          <Route path={PATHS.SETTINGS.ACADEMIC_YEARS} element={<ManageAcademicYearsPage />} />

          {/* Catch-all */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
              <p className="text-xl font-medium text-slate-800">Page under construction</p>
              <p className="text-sm text-slate-500 mt-2">This module is currently being developed.</p>
            </div>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
}
