import { Router } from 'express';
import { attendanceController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Ensure all attendance routes are protected
router.use(authenticate);

// Student Attendance
router.post('/student', attendanceController.markStudentAttendance);
router.post('/student/bulk', attendanceController.markBulkStudentAttendance);
router.get('/student', attendanceController.getStudentAttendance);

// Teacher Attendance
router.post('/teacher', attendanceController.markTeacherAttendance);
router.get('/teacher', attendanceController.getTeacherAttendance);

export default router;
