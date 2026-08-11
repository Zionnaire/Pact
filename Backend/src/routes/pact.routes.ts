import { Router } from 'express';
import * as pactController from '../controllers/pact.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createPactSchema,
  updatePactSchema,
  createInviteSchema,
  acceptInviteParamsSchema,
  inviteIdParamsSchema,
} from '../validators/pact.validator';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createPactSchema), pactController.createPact);
router.get('/me', requirePairedPact, pactController.getMyPact);
router.patch('/me', requirePairedPact, validate(updatePactSchema), pactController.updatePact);
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
