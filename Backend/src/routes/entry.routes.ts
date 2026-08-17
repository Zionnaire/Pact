import { Router } from 'express';
import * as entryController from '../controllers/entry.controller';
import { authMiddleware, requirePairedPact, requireCompleteProfile } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadAudio } from '../middleware/upload.middleware';
import {
  createEntrySchema,
  updateEntrySchema,
  entryIdParamsSchema,
  setReactionSchema,
} from '../validators/entry.validator';

const router = Router();

// Not gated by requirePairedPact — exporting your own words is a personal
// account action, not a pact-scoped one, so it can't be blocked by pact
// state (e.g. a partner who already left, or before you've paired at all).
router.get('/export', authMiddleware, entryController.exportMyData);

router.use(authMiddleware, requirePairedPact);

router.get('/mine', entryController.getMyEntries);
router.post('/', requireCompleteProfile, validate(createEntrySchema), entryController.createEntry);
router.post('/voice', requireCompleteProfile, uploadAudio, validate(createEntrySchema), entryController.createVoiceEntry);
router.patch('/:id', validate(entryIdParamsSchema, 'params'), validate(updateEntrySchema), entryController.updateEntry);
router.delete('/:id', validate(entryIdParamsSchema, 'params'), entryController.deleteEntry);
router.patch(
  '/:id/reaction',
  validate(entryIdParamsSchema, 'params'),
  validate(setReactionSchema),
  entryController.setReaction,
);

export default router;
