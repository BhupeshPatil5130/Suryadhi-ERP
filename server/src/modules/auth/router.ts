import { Router } from 'express';
import { authController } from './controller';
import { authenticate, authorize, validate, authRateLimiter } from '../../middleware';
import { loginSchema, signupSchema, updateProfileSchema, createUserSchema, updateUserSchema } from './schema';

const router = Router();

// POST /api/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// POST /api/auth/signup
router.post('/signup', authRateLimiter, validate(signupSchema), (req, res, next) =>
  authController.signup(req, res, next)
);

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

// GET /api/auth/csrf-token
router.get('/csrf-token', (req, res) => {
  const { setCsrfCookie } = require('../../middleware');
  const csrfToken = setCsrfCookie(res);
  res.json({ success: true, csrfToken });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res, next) =>
  authController.logout(req, res, next)
);

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

// PUT /api/auth/profile
router.put('/profile', authenticate, validate(updateProfileSchema), (req, res, next) =>
  authController.updateProfile(req, res, next)
);

// GET /api/auth/users
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res, next) =>
  authController.listUsers(req, res, next)
);

// POST /api/auth/users
router.post('/users', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), validate(createUserSchema), (req, res, next) =>
  authController.createUser(req, res, next)
);

// PUT /api/auth/users/:id
router.put('/users/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), validate(updateUserSchema), (req, res, next) =>
  authController.updateUser(req, res, next)
);

// DELETE /api/auth/users/:id
router.delete('/users/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), (req, res, next) =>
  authController.deleteUser(req, res, next)
);

export default router;

