import { Router } from 'express';
import { settingsController } from './controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// All settings routes require authentication
router.use(authenticate);

/**
 * GET /api/settings
 * List settings for the current school (or all for SUPER_ADMIN).
 * All authenticated roles can read settings.
 */
router.get(
  '/',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  settingsController.list.bind(settingsController)
);

/**
 * PUT /api/settings/bulk
 * Atomically upsert multiple settings.
 * Restricted to admin roles.
 */
router.put(
  '/bulk',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  settingsController.bulkUpsert.bind(settingsController)
);

/**
 * PUT /api/settings/:key
 * Upsert a single setting by key.
 * Restricted to admin roles.
 */
router.put(
  '/:key',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  settingsController.upsert.bind(settingsController)
);

/**
 * DELETE /api/settings/:key
 * Delete a setting by key.
 * Restricted to admin roles.
 */
router.delete(
  '/:key',
  authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  settingsController.remove.bind(settingsController)
);

export default router;
