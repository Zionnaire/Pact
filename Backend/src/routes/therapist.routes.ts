import { Router } from 'express';
import * as therapistController from '../controllers/therapist.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { therapistAuthMiddleware } from '../middleware/therapistAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { grantTherapistAccessSchema, grantIdParamsSchema } from '../validators/therapist.validator';

const router = Router();

router.get('/summary', therapistAuthMiddleware, therapistController.getTherapistSummary);

router.use(authMiddleware, requirePairedPact);
router.post('/grants', validate(grantTherapistAccessSchema), therapistController.grantTherapistAccess);
router.get('/grants', therapistController.listTherapistGrants);
router.delete('/grants/:id', validate(grantIdParamsSchema, 'params'), therapistController.revokeTherapistAccess);

export default router;
