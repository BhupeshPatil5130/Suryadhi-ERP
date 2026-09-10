import { Request, Response } from 'express';
import { operationsService } from './service';
import { 
  createPurchaseOrderSchema, 
  updatePurchaseOrderStatusSchema, 
  reportShortageDamageSchema 
} from './schema';

export class OperationsController {
  async getPurchaseOrders(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const result = await operationsService.getPurchaseOrders(schoolId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createPurchaseOrder(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedData = createPurchaseOrderSchema.parse(req.body);
      const result = await operationsService.createPurchaseOrder(schoolId, validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updatePurchaseOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schoolId = (req as any).user.schoolId;
      const validatedData = updatePurchaseOrderStatusSchema.parse(req.body);
      const result = await operationsService.updatePurchaseOrderStatus(id as string, schoolId, validatedData);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getShortageReports(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const result = await operationsService.getShortageReports(schoolId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createShortageReport(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedData = reportShortageDamageSchema.parse(req.body);
      const result = await operationsService.createShortageReport(schoolId, validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async resolveShortageReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schoolId = (req as any).user.schoolId;
      const result = await operationsService.resolveShortageReport(id as string, schoolId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getExchangeOrders(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user?.schoolId;
      const result = await operationsService.getExchangeOrders(schoolId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createExchangeOrder(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user?.schoolId;
      const result = await operationsService.createExchangeOrder(schoolId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateExchangeOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schoolId = (req as any).user?.schoolId;
      const { status } = req.body;
      const result = await operationsService.updateExchangeOrderStatus(id as string, schoolId, status);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const operationsController = new OperationsController();
