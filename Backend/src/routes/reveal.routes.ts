import { Router } from 'express';
import * as revealController from '../controllers/reveal.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { revealLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware, requirePairedPact);

router.post('/:id/consent', revealLimiter, revealController.toggleRevealConsent);
router.post('/:id/reveal', revealLimiter, revealController.performReveal);
router.post('/:id/delay', revealLimiter, revealController.requestRevealDelay);
router.get('/:id/revealed', revealController.getRevealedCycle);

export default router;
