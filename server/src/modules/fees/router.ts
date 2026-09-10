import { Router } from 'express';
import { feeController } from './controller';
import { authenticate, authorize, schoolScope, validate } from '../../middleware';
import { calculateFeeSchema, createReceiptSchema, depositSchema, convertPaymentSchema, convertBulkPaymentSchema } from './schema';

const router = Router();

router.use(authenticate);
router.use(schoolScope);

// GET /api/fees/calculate
router.get('/calculate', validate(calculateFeeSchema, 'query'), (req, res, next) =>
  feeController.calculate(req, res, next)
);

// GET /api/fees/receipts/:admissionId
router.get('/receipts/:admissionId', (req, res, next) =>
  feeController.getReceipts(req, res, next)
);

// POST /api/fees/receipts
router.post(
  '/receipts',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(createReceiptSchema),
  (req, res, next) => feeController.createReceipt(req, res, next)
);

// GET /api/fees/cash-receipts — List cash receipts for conversion
router.get('/cash-receipts', (req, res, next) =>
  feeController.getCashReceipts(req, res, next)
);

// GET /api/fees/deposits/pending
router.get('/deposits/pending', (req, res, next) =>
  feeController.getPendingDeposits(req, res, next)
);

// POST /api/fees/deposits
router.post(
  '/deposits',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(depositSchema),
  (req, res, next) => feeController.createDeposit(req, res, next)
);

// GET /api/fees/deposits
router.get('/deposits', (req, res, next) =>
  feeController.listDeposits(req, res, next)
);

// POST /api/fees/convert-payment — Single receipt conversion
router.post(
  '/convert-payment',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(convertPaymentSchema),
  (req, res, next) => feeController.convertPayment(req, res, next)
);

// POST /api/fees/convert-bulk — Bulk conversion (cash to online)
router.post(
  '/convert-bulk',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(convertBulkPaymentSchema),
  (req, res, next) => feeController.convertBulkPayment(req, res, next)
);

// GET /api/fees/funds-transfer — Funds Transfer Summary Report
router.get('/funds-transfer', (req, res, next) =>
  feeController.getFundsTransferSummary(req, res, next)
);

// GET /api/fees/homebuddy — Fee Collection through Homebuddy
router.get('/homebuddy', (req, res, next) =>
  feeController.getHomebuddyReceipts(req, res, next)
);

// GET /api/fees/online-payments — Online Payment Details
router.get('/online-payments', (req, res, next) =>
  feeController.getOnlinePayments(req, res, next)
);

export default router;

