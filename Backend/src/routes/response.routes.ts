import { Router } from 'express';
import * as responseController from '../controllers/response.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { respondToEntrySchema, setResolutionSchema } from '../validators/response.validator';

const router = Router();

router.use(authMiddleware, requirePairedPact);

router.post('/:id/responses', validate(respondToEntrySchema), responseController.respondToEntry);
router.patch('/:id/resolution', validate(setResolutionSchema), responseController.setResolution);

export default router;
