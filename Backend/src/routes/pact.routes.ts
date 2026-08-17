import { Router } from 'express';
import * as pactController from '../controllers/pact.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate.middleware';
import {
  createPactSchema,
  updatePactSchema,
  createInviteSchema,
  acceptInviteParamsSchema,
  inviteIdParamsSchema,
  quickJoinSchema,
} from '../validators/pact.validator';

const router = Router();

// Public — creates its own account, so it can't sit behind authMiddleware.
// Rate-limited the same as register/login since it's an unauthenticated
// account-creation path.
router.post(
  '/invites/:code/quick-join',
  authLimiter,
  validate(acceptInviteParamsSchema, 'params'),
  validate(quickJoinSchema),
  pactController.quickJoinInvite,
);

router.use(authMiddleware);

router.post('/', validate(createPactSchema), pactController.createPact);
router.get('/me', requirePairedPact, pactController.getMyPact);
router.patch('/me', requirePairedPact, validate(updatePactSchema), pactController.updatePact);
router.post('/me/leave', requirePairedPact, pactController.leavePact);
router.post('/invites', requirePairedPact, validate(createInviteSchema), pactController.createInvite);
router.get('/invites', requirePairedPact, pactController.listInvites);
router.delete('/invites/:id', requirePairedPact, validate(inviteIdParamsSchema, 'params'), pactController.cancelInvite);
router.post(
  '/invites/:code/accept',
  validate(acceptInviteParamsSchema, 'params'),
  pactController.acceptInvite,
);
router.patch('/me/pause', requirePairedPact, pactController.pauseCycle);
router.patch('/me/resume', requirePairedPact, pactController.resumeCycle);

export default router;
