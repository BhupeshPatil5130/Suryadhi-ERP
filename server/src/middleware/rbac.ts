import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Role-Based Access Control middleware.
 * Restricts access to routes based on user roles.
 * Must be used AFTER authenticate middleware.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Restricts access to own school's data only.
 * Super admins bypass this check.
 */
export const schoolScope = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Super admins can access all school data or pass a target schoolId
  if (req.user.role === 'SUPER_ADMIN') {
    const targetSchoolId = (req.query?.schoolId as string) || (req.body?.schoolId as string);
    if (targetSchoolId) {
      if (req.query) req.query.schoolId = targetSchoolId;
      if (req.body && typeof req.body === 'object') req.body.schoolId = targetSchoolId;
    }
    next();
    return;
  }

  // Others must have a school assigned
  if (!req.user.schoolId) {
    res.status(403).json({ error: 'No school assigned to user' });
    return;
  }

  // Inject schoolId into query AND body to prevent parameter tampering
  if (req.query) {
    req.query.schoolId = req.user.schoolId;
  }
  if (req.body && typeof req.body === 'object') {
    req.body.schoolId = req.user.schoolId;
  }

  next();
};
