import { Request, Response } from 'express';
import { attendanceService } from './service';
import { 
  markStudentAttendanceSchema, 
  bulkStudentAttendanceSchema,
  markTeacherAttendanceSchema,
  getAttendanceQuerySchema
} from './schema';

export class AttendanceController {
  async markStudentAttendance(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const userId = (req as any).user.id;
      
      const validatedData = markStudentAttendanceSchema.parse(req.body);
      const result = await attendanceService.markStudentAttendance(schoolId, userId, validatedData);
      
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async markBulkStudentAttendance(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const userId = (req as any).user.id;
      
      const validatedData = bulkStudentAttendanceSchema.parse(req.body);
      const result = await attendanceService.markBulkStudentAttendance(schoolId, userId, validatedData);
      
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async markTeacherAttendance(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      
      const validatedData = markTeacherAttendanceSchema.parse(req.body);
      const result = await attendanceService.markTeacherAttendance(schoolId, validatedData);
      
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getStudentAttendance(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedQuery = getAttendanceQuerySchema.parse(req.query);
      
      const result = await attendanceService.getStudentAttendance(schoolId, validatedQuery);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTeacherAttendance(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user.schoolId;
      const validatedQuery = getAttendanceQuerySchema.parse(req.query);
      
      const result = await attendanceService.getTeacherAttendance(schoolId, validatedQuery);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const attendanceController = new AttendanceController();
