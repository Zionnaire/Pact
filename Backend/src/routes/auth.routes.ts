import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate.middleware';
import { uploadImage } from '../middleware/upload.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  updateProfileSchema,
  deleteAccountSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authMiddleware, validate(logoutSchema), authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.delete('/me', authMiddleware, validate(deleteAccountSchema), authController.deleteAccount);
router.post('/me/avatar', authMiddleware, uploadImage, authController.uploadAvatar);
router.get('/config', authController.appConfig);

export default router;
