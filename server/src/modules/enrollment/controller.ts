import { Request, Response, NextFunction } from 'express';
import { enrollmentService } from './service';

export class EnrollmentController {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await enrollmentService.getSummary(req.user!.schoolId!, req.query.academicYearId as string | undefined);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSourceWise(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await enrollmentService.getSourceWise(req.user!.schoolId!, req.query.academicYearId as string | undefined);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getRetention(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await enrollmentService.getRetention(req.user!.schoolId!);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getLSQLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await enrollmentService.getLSQLeads(req.user!.schoolId!);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async createLSQLead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await enrollmentService.createLSQLead(req.user!.schoolId!, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export const enrollmentController = new EnrollmentController();
