import { Request, Response, NextFunction } from 'express';
import { authService } from './service';
import { config } from '../../config';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !config.isDev,
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      // Set tokens in httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      // Set tokens in httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const result = await authService.refresh(refreshToken);

      // Set new tokens in cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: { accessToken: result.accessToken, refreshToken: result.refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await authService.logout(refreshToken, req.user?.userId);

      // Clear cookies
      res.clearCookie('accessToken', COOKIE_OPTIONS);
      res.clearCookie('refreshToken', COOKIE_OPTIONS);

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.listUsers(req.user?.schoolId, req.user!.role);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Allow SUPER_ADMIN to assign any school or null, and SCHOOL_ADMIN to use their schoolId or payload schoolId
      const schoolId = req.user!.role === 'SUPER_ADMIN'
        ? (req.body.schoolId || null)
        : (req.user!.schoolId || req.body.schoolId || null);

      const user = await authService.createUser({
        ...req.body,
        schoolId,
      });
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      // SCHOOL_ADMIN can only edit users inside their own school
      if (req.user!.role !== 'SUPER_ADMIN') {
        const existingUser = await authService.getProfile(req.params.id as string);
        if (existingUser.school?.id !== req.user!.schoolId) {
          res.status(403).json({ error: 'Access denied: User is not in your school' });
          return;
        }
        // Force the same schoolId
        req.body.schoolId = req.user!.schoolId;
      }
      const user = await authService.updateUser(req.params.id as string, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      // SCHOOL_ADMIN can only delete users inside their own school
      if (req.user!.role !== 'SUPER_ADMIN') {
        const existingUser = await authService.getProfile(req.params.id as string);
        if (existingUser.school?.id !== req.user!.schoolId) {
          res.status(403).json({ error: 'Access denied: User is not in your school' });
          return;
        }
      }
      await authService.deleteUser(req.params.id as string);
      res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
