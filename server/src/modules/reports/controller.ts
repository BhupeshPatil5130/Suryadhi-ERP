import { Request, Response, NextFunction } from 'express';
import { reportsService } from './service';

export class ReportsController {
  async admissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getAdmissionsReport(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async enquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getEnquiriesReport(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async paymentDue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getPaymentDueReport(req.user!.schoolId!);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async cancelledReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getCancelledReceipts(req.user!.schoolId!);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async transfers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getTransfersReport(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async fcr(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getFCR(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async feeCard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getFeeCard(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async admissionCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getAdmissionCount(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async enquiryCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getEnquiryCount(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async onlinePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getOnlinePaymentsReport(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async royaltyForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getForecastedRoyaltyReport(req.user!.schoolId!);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async lsqEnquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getLSQEnquiriesReport(req.user!.schoolId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}

export const reportsController = new ReportsController();
