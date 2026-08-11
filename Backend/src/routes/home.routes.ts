import { Router } from 'express';
import * as homeController from '../controllers/home.controller';
import { authMiddleware, requirePairedPact } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, requirePairedPact, homeController.getHomeSnapshot);

export default router;
