import { Router } from 'express';
import * as pulseController from '../controllers/pulse.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, requirePairedPact, pulseController.getPulse);

export default router;
