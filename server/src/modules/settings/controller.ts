import { Request, Response, NextFunction } from 'express';
import { settingsService } from './service';
import { AppError } from '../../middleware/errorHandler';
import { getEffectiveSchoolId } from '../../utils/helpers';

export class SettingsController {
  /**
   * GET /api/settings
   * Lists settings visible to the current user's school.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getEffectiveSchoolId(req);
      const settings = await settingsService.list(schoolId);
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/settings/:key
   * Upsert a single setting.
   * SUPER_ADMIN can omit schoolId to write a global setting.
   */
  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const { value, description } = req.body;

      if (value === undefined || value === null) {
        throw new AppError("'value' is required", 400);
      }

      // Determine scope: SUPER_ADMIN can pass explicit schoolId or write globally
      let schoolId: string | null = null;
      if ((req.user as any)?.role === 'SUPER_ADMIN') {
        schoolId = req.body.schoolId ?? null;
      } else {
        schoolId = getEffectiveSchoolId(req) ?? null;
        if (!schoolId) throw new AppError('School context required', 403);
      }

      const setting = await settingsService.set(key, String(value), schoolId, description);
      res.json({ success: true, data: setting });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/settings (bulk)
   * Atomically upsert multiple settings.
   * Body: { settings: [{ key, value, description? }], schoolId? }
   */
  async bulkUpsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { settings, schoolId: bodySchoolId } = req.body;

      if (!Array.isArray(settings) || settings.length === 0) {
        throw new AppError("'settings' must be a non-empty array", 400);
      }

      let schoolId: string | null = null;
      if ((req.user as any)?.role === 'SUPER_ADMIN') {
        schoolId = bodySchoolId ?? null;
      } else {
        schoolId = getEffectiveSchoolId(req) ?? null;
        if (!schoolId) throw new AppError('School context required', 403);
      }

      // Validate each entry
      for (const entry of settings) {
        if (!entry.key || entry.value === undefined) {
          throw new AppError("Each setting must have 'key' and 'value'", 400);
        }
      }

      const results = await settingsService.bulkSet(settings, schoolId);
      res.json({ success: true, data: results, count: results.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/settings/:key
   * Remove a setting.
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;

      let schoolId: string | null = null;
      if ((req.user as any)?.role === 'SUPER_ADMIN') {
        schoolId = req.body.schoolId ?? req.query.schoolId ?? null;
      } else {
        schoolId = getEffectiveSchoolId(req) ?? null;
        if (!schoolId) throw new AppError('School context required', 403);
      }

      await settingsService.delete(key, schoolId);
      res.json({ success: true, message: `Setting '${key}' deleted` });
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
