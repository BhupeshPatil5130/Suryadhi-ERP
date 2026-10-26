import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, schoolScope } from '../../middleware';
import { reportsController } from './controller';

const router = Router();
router.use(authenticate);
router.use(schoolScope);

// GET /api/reports/admissions
router.get('/admissions', (req: Request, res: Response, next: NextFunction) => reportsController.admissions(req, res, next));

// GET /api/reports/enquiries
router.get('/enquiries', (req: Request, res: Response, next: NextFunction) => reportsController.enquiries(req, res, next));

// GET /api/reports/payment-due
router.get('/payment-due', (req: Request, res: Response, next: NextFunction) => reportsController.paymentDue(req, res, next));

// GET /api/reports/cancelled-receipts
router.get('/cancelled-receipts', (req: Request, res: Response, next: NextFunction) => reportsController.cancelledReceipts(req, res, next));

// GET /api/reports/transfers
router.get('/transfers', (req: Request, res: Response, next: NextFunction) => reportsController.transfers(req, res, next));

// GET /api/reports/fcr (Fee Collection Report)
router.get('/fcr', (req: Request, res: Response, next: NextFunction) => reportsController.fcr(req, res, next));

// GET /api/reports/fee-card
router.get('/fee-card', (req: Request, res: Response, next: NextFunction) => reportsController.feeCard(req, res, next));

// GET /api/reports/admission-count
router.get('/admission-count', (req: Request, res: Response, next: NextFunction) => reportsController.admissionCount(req, res, next));

// GET /api/reports/enquiry-count
router.get('/enquiry-count', (req: Request, res: Response, next: NextFunction) => reportsController.enquiryCount(req, res, next));

// GET /api/reports/online-payments
router.get('/online-payments', (req: Request, res: Response, next: NextFunction) => reportsController.onlinePayments(req, res, next));

// GET /api/reports/royalty-forecast
router.get('/royalty-forecast', (req: Request, res: Response, next: NextFunction) => reportsController.royaltyForecast(req, res, next));

// GET /api/reports/lsq-enquiries
router.get('/lsq-enquiries', (req: Request, res: Response, next: NextFunction) => reportsController.lsqEnquiries(req, res, next));

export default router;
