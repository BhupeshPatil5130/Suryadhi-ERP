import { Router } from 'express';
import { operationsController } from './controller';
import { authenticate, authorize, schoolScope } from '../../middleware';

const router = Router();

// Protect all operations routes with authentication, role authorization, and tenant scoping
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'));
router.use(schoolScope);

// Purchase Orders
router.get('/purchase-orders', operationsController.getPurchaseOrders);
router.post('/purchase-orders', operationsController.createPurchaseOrder);
router.put('/purchase-orders/:id/status', operationsController.updatePurchaseOrderStatus);

// Shortage & Damage Reports
router.get('/shortage-reports', operationsController.getShortageReports);
router.get('/shortages', operationsController.getShortageReports);
router.post('/shortage-reports', operationsController.createShortageReport);
router.put('/shortage-reports/:id/resolve', operationsController.resolveShortageReport);

// Exchange Orders
router.get('/exchange-orders', operationsController.getExchangeOrders);
router.post('/exchange-orders', operationsController.createExchangeOrder);
router.put('/exchange-orders/:id/status', operationsController.updateExchangeOrderStatus);

export default router;
