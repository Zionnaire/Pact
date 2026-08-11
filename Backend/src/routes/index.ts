/**
 * routes/index.ts
 * Mounts every /api/v1 resource router. See Pact_System_Design.md §3 for
 * the full route table and auth rules.
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import pactRoutes from './pact.routes';
import homeRoutes from './home.routes';
import entryRoutes from './entry.routes';
import revealRoutes from './reveal.routes';
import responseRoutes from './response.routes';
import pulseRoutes from './pulse.routes';
import talkRoutes from './talk.routes';
import therapistRoutes from './therapist.routes';
import notificationRoutes from './notification.routes';
import aiRoutes from './ai.routes';
import subscriptionRoutes from './subscription.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/pacts', pactRoutes);
router.use('/home', homeRoutes);
router.use('/entries', entryRoutes);
router.use('/cycles', revealRoutes);
router.use('/entries', responseRoutes); // /entries/:id/responses, /entries/:id/resolution
router.use('/pulse', pulseRoutes);
router.use('/talks', talkRoutes);
router.use('/therapist', therapistRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
