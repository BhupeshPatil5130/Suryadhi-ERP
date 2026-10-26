import { Request, Response, NextFunction } from 'express';
import { admissionService } from './service';
import { getEffectiveSchoolId } from '../../utils/helpers';
import { AppError } from '../../middleware/errorHandler';

export class AdmissionController {
  private getSchoolId(req: Request): string {
    const schoolId = getEffectiveSchoolId(req);
    if (!schoolId) {
      throw new AppError('School context is required for this operation', 400);
    }
    return schoolId;
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await admissionService.list(schoolId, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const admission = await admissionService.getById(req.params.id as string, schoolId);
      res.json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const admission = await admissionService.create(schoolId, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const admission = await admissionService.update(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async graduate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await admissionService.graduate(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async quit(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await admissionService.quit(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async transferOut(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await admissionService.transferOut(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async changeName(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await admissionService.changeName(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const admissionController = new AdmissionController();
