import { Router } from 'express';
import * as entryController from '../controllers/entry.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadAudio } from '../middleware/upload.middleware';
import {
  createEntrySchema,
  updateEntrySchema,
  entryIdParamsSchema,
  setReactionSchema,
} from '../validators/entry.validator';

const router = Router();

router.use(authMiddleware, requirePairedPact);

router.get('/mine', entryController.getMyEntries);
router.post('/', validate(createEntrySchema), entryController.createEntry);
router.post('/voice', uploadAudio, validate(createEntrySchema), entryController.createVoiceEntry);
router.patch('/:id', validate(entryIdParamsSchema, 'params'), validate(updateEntrySchema), entryController.updateEntry);
router.delete('/:id', validate(entryIdParamsSchema, 'params'), entryController.deleteEntry);
router.patch(
  '/:id/reaction',
  validate(entryIdParamsSchema, 'params'),
  validate(setReactionSchema),
  entryController.setReaction,
);

export default router;
