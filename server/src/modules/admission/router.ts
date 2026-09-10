import { Router } from 'express';
import { admissionController } from './controller';
import { authenticate, authorize, schoolScope, validate } from '../../middleware';
import {
  createAdmissionSchema,
  updateAdmissionSchema,
  quitAdmissionSchema,
  transferOutSchema,
  graduateSchema,
  nameChangeSchema,
  admissionListQuerySchema,
} from './schema';

const router = Router();

router.use(authenticate);
router.use(schoolScope);

// GET /api/admissions
router.get('/', validate(admissionListQuerySchema, 'query'), (req, res, next) =>
  admissionController.list(req, res, next)
);

// GET /api/admissions/:id
router.get('/:id', (req, res, next) => admissionController.getById(req, res, next));

// GET /api/admissions/:id/receipt & /api/admissions/:id/receipts (alias for fee receipts)
router.get(['/:id/receipt', '/:id/receipts'], (req, res, next) => {
  req.params.admissionId = req.params.id;
  import('../fees/controller').then(({ feeController }) => feeController.getReceipts(req, res, next)).catch(next);
});

// POST /api/admissions
router.post(
  '/',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(createAdmissionSchema),
  (req, res, next) => admissionController.create(req, res, next)
);

// PUT /api/admissions/:id
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(updateAdmissionSchema),
  (req, res, next) => admissionController.update(req, res, next)
);

// POST /api/admissions/:id/graduate
router.post(
  '/:id/graduate',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(graduateSchema),
  (req, res, next) => admissionController.graduate(req, res, next)
);

// POST /api/admissions/:id/quit
router.post(
  '/:id/quit',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(quitAdmissionSchema),
  (req, res, next) => admissionController.quit(req, res, next)
);

// POST /api/admissions/:id/transfer-out
router.post(
  '/:id/transfer-out',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(transferOutSchema),
  (req, res, next) => admissionController.transferOut(req, res, next)
);

// PUT /api/admissions/:id/name-change
router.put(
  '/:id/name-change',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validate(nameChangeSchema),
  (req, res, next) => admissionController.changeName(req, res, next)
);

export default router;
