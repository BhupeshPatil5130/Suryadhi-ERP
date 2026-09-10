import { Request, Response } from 'express';
import { academicsService } from './service';
import { 
  createSubjectSchema, 
  createExamSchema, 
  createAssessmentSchema, 
  marksEntrySchema 
} from './schema';

export class AcademicsController {
  async createSubject(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedData = createSubjectSchema.parse(req.body);
      const result = await academicsService.createSubject(schoolId, validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getSubjects(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const { programId } = req.query;
      const result = await academicsService.getSubjects(schoolId, programId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createExam(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedData = createExamSchema.parse(req.body);
      const result = await academicsService.createExam(schoolId, validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getExams(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const { academicYearId } = req.query;
      const result = await academicsService.getExams(schoolId, academicYearId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createAssessment(req: Request, res: Response) {
    try {
      const validatedData = createAssessmentSchema.parse(req.body);
      const result = await academicsService.createAssessment(validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async enterMarks(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const validatedData = marksEntrySchema.parse(req.body);
      const result = await academicsService.enterMarks(userId, validatedData);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getMarks(req: Request, res: Response) {
    try {
      const { assessmentId } = req.params;
      const result = await academicsService.getMarks(assessmentId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const academicsController = new AcademicsController();
