import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate.middleware';
import { toneCheckSchema } from '../validators/ai.validator';

const router = Router();

router.post('/tone-check', authMiddleware, requirePairedPact, aiLimiter, validate(toneCheckSchema), aiController.toneCheck);

export default router;
