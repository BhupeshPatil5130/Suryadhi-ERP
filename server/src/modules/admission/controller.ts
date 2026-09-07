import { Request, Response, NextFunction } from 'express';
import { admissionService } from './service';

export class AdmissionController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await admissionService.list(req.user!.schoolId!, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await admissionService.getById(req.params.id as string, req.user!.schoolId!);
      res.json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await admissionService.create(req.user!.schoolId!, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const admission = await admissionService.update(req.params.id as string, req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: admission });
    } catch (error) { next(error); }
  }

  async graduate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await admissionService.graduate(req.params.id as string, req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async quit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await admissionService.quit(req.params.id as string, req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async transferOut(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await admissionService.transferOut(req.params.id as string, req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async changeName(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await admissionService.changeName(req.params.id as string, req.user!.schoolId!, req.body, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const admissionController = new AdmissionController();
