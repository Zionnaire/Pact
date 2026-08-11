import { Router } from 'express';
import * as talkController from '../controllers/talk.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { scheduleTalkSchema } from '../validators/talk.validator';

const router = Router();

router.use(authMiddleware, requirePairedPact);

router.post('/', validate(scheduleTalkSchema), talkController.scheduleTalk);
router.get('/', talkController.listTalks);

export default router;
