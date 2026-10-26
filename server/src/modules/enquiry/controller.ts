import { Request, Response, NextFunction } from 'express';
import { enquiryService } from './service';
import { getEffectiveSchoolId } from '../../utils/helpers';
import { AppError } from '../../middleware/errorHandler';

export class EnquiryController {
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
      const result = await enquiryService.list(schoolId, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const enquiry = await enquiryService.getById(req.params.id as string, schoolId);
      res.json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const enquiry = await enquiryService.create(schoolId, req.body, req.user!.userId);
      res.status(201).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const enquiry = await enquiryService.update(req.params.id as string, schoolId, req.body, req.user!.userId);
      res.json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  }

  async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const followUp = await enquiryService.addFollowUp(
        req.params.id as string,
        schoolId,
        req.body,
        req.user!.userId
      );
      res.status(201).json({ success: true, data: followUp });
    } catch (error) {
      next(error);
    }
  }

  async convert(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const result = await enquiryService.convertToAdmission(
        req.params.id as string,
        schoolId,
        req.user!.userId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      await enquiryService.delete(req.params.id as string, schoolId, req.user!.userId);
      res.json({ success: true, message: 'Enquiry deleted' });
    } catch (error) {
      next(error);
    }
  }

  async createAdvanceReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const receipt = await enquiryService.createAdvanceReceipt(
        req.params.id as string,
        schoolId,
        req.body,
        req.user!.userId
      );
      res.status(201).json({ success: true, data: receipt });
    } catch (error) {
      next(error);
    }
  }

  async getAdvanceReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = this.getSchoolId(req);
      const receipts = await enquiryService.getAdvanceReceipts(
        req.params.id as string,
        schoolId
      );
      res.json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  }
}

export const enquiryController = new EnquiryController();
