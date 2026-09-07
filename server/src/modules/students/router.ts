import { Router } from 'express';
import { studentController } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticate);

// Student Profile
router.get('/:id', studentController.getStudentProfile);

// Documents
router.post('/documents', studentController.uploadDocument);
router.get('/:studentId/documents', studentController.getDocuments);
router.put('/documents/:documentId/verify', studentController.verifyDocument);

export default router;
