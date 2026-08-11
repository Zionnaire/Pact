import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { adminAuthMiddleware } from '../middleware/adminAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { checkoutSchema } from '../validators/subscription.validator';

const router = Router();

router.get('/', authMiddleware, requirePairedPact, subscriptionController.getSubscription);
router.post('/checkout', authMiddleware, requirePairedPact, validate(checkoutSchema), subscriptionController.checkout);

// Operator-only escape hatch while Paystack isn't live yet — see Pact_System_Design.md §6.
router.post('/:pactId/grant-bonded', adminAuthMiddleware, subscriptionController.grantBondedManually);

export default router;
