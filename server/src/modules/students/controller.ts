import { Request, Response } from 'express';
import { studentService } from './service';
import { uploadDocumentSchema, verifyDocumentSchema } from './schema';

export class StudentController {
  async uploadDocument(req: Request, res: Response) {
    try {
      const validatedData = uploadDocumentSchema.parse(req.body);
      const result = await studentService.uploadDocument(validatedData);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getDocuments(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const result = await studentService.getDocuments(studentId as string);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async verifyDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      const validatedData = verifyDocumentSchema.parse(req.body);
      const result = await studentService.verifyDocument(documentId as string, validatedData);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getStudentProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await studentService.getStudentProfile(id as string);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const studentController = new StudentController();
