import { Request, Response, NextFunction } from 'express';
import { feeService } from './service';

export class FeeController {
  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.calculateFee(req.user!.schoolId!, req.query as any);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getReceipts(req.params.admissionId as string, req.user?.schoolId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async createReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const receipt = await feeService.createReceipt(req.user!.schoolId!, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: receipt });
    } catch (error) { next(error); }
  }

  async createDeposit(req: Request, res: Response, next: NextFunction) {
    try {
      const deposit = await feeService.createDeposit(req.user!.schoolId!, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: deposit });
    } catch (error) { next(error); }
  }

  async getPendingDeposits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getPendingDeposits(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async convertPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.convertPaymentMode(req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async listDeposits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.listDeposits(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getCashReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getCashReceipts(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async convertBulkPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.convertBulkPayment(req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getFundsTransferSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getFundsTransferSummary(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getHomebuddyReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getHomebuddyReceipts(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getOnlinePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feeService.getOnlinePayments(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}

export const feeController = new FeeController();
