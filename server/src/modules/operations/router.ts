import { Router } from 'express';
import { operationsController } from './controller';
import { authenticate, authorize, schoolScope } from '../../middleware';

const router = Router();

// Protect all operations routes with authentication, role authorization, and tenant scoping
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'));
router.use(schoolScope);

// Purchase Orders
router.get('/purchase-orders', (req, res) => operationsController.getPurchaseOrders(req, res));
router.get('/purchase-orders/:id', (req, res) => operationsController.getPurchaseOrderById(req, res));
router.post('/purchase-orders', (req, res) => operationsController.createPurchaseOrder(req, res));
router.put('/purchase-orders/:id/status', (req, res) => operationsController.updatePurchaseOrderStatus(req, res));
router.delete('/purchase-orders/:id', (req, res) => operationsController.deletePurchaseOrder(req, res));

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
