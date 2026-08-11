import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerPushTokenSchema, notificationIdParamsSchema } from '../validators/notification.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.listNotifications);
router.patch('/:id/read', validate(notificationIdParamsSchema, 'params'), notificationController.markNotificationRead);
router.post('/push-token', validate(registerPushTokenSchema), notificationController.registerPushToken);

export default router;
