import { Router } from 'express';
import { academicsController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticate);

// Subjects
router.post('/subjects', academicsController.createSubject);
router.get('/subjects', academicsController.getSubjects);

// Exams
router.post('/exams', academicsController.createExam);
router.get('/exams', academicsController.getExams);

// Assessments & Marks
router.post('/assessments', academicsController.createAssessment);
router.post('/marks', academicsController.enterMarks);
router.get('/assessments/:assessmentId/marks', academicsController.getMarks);

export default router;
