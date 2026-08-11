/**
 * configs/cron.ts
 * In-process scheduler for time-based cycle transitions and reveal-day
 * notifications. Single-instance only — see Pact_System_Design.md §7 for
 * why (and when to migrate to Agenda/BullMQ + Redis).
 */

import cron from 'node-cron';
import { Cycle } from '../models/Cycle.model';
import { Pact } from '../models/Pact.model';
import { Notification } from '../models/Notification.model';
import { sendPushNotifications } from './expoPush';
import { Session } from '../models/Session.model';
import { extractThemesForCycle } from '../services/theme.service';
import { logger } from '../utils/logger';

// How long a cycle stays in `revealed` (readable, but still counted as the
// "current" reveal) before it's archived into Pulse/theme history.
const ARCHIVE_GRACE_MS = 24 * 60 * 60 * 1000;

async function flipOpenCyclesToReady(): Promise<void> {
  const now = new Date();
  const dueCycles = await Cycle.find({ status: 'open', revealAt: { $lte: now } });

  for (const cycle of dueCycles) {
    cycle.status = 'ready';
    await cycle.save();

    const pact = await Pact.findById(cycle.pactId);
    if (!pact) continue;

    const notifications = await Notification.insertMany(
      pact.partners.map((userId) => ({
        userId,
        kind: 'reveal_ready',
        payload: { cycleId: cycle._id, pactId: pact._id },
      })),
    );

    const sessions = await Session.find({
      userId: { $in: pact.partners },
      expoPushToken: { $exists: true, $ne: null },
      revokedAt: null,
    });

    await sendPushNotifications(
      sessions.map((s) => ({
        to: s.expoPushToken as string,
        title: 'Your cycle is ready to reveal',
        body: 'Both of you can now unlock the vault together.',
        data: { cycleId: String(cycle._id) },
      })),
    );

    logger.info(`Cycle ${cycle._id} flipped open → ready (${notifications.length} notifications queued)`);
  }
}

async function archiveRevealedCycles(): Promise<void> {
  const cutoff = new Date(Date.now() - ARCHIVE_GRACE_MS);
  const dueCycles = await Cycle.find({ status: 'revealed', revealedAt: { $lte: cutoff } });

  for (const cycle of dueCycles) {
    // eslint-disable-next-line no-await-in-loop
    await extractThemesForCycle(cycle.pactId.toString(), cycle._id.toString());
    cycle.status = 'archived';
    // eslint-disable-next-line no-await-in-loop
    await cycle.save();
    logger.info(`Cycle ${cycle._id} archived`);
  }
}

export function startCronJobs(): void {
  // Every minute — cheap query, small tables, acceptable at this scale.
  cron.schedule('* * * * *', () => {
    flipOpenCyclesToReady().catch((err) => logger.error('Cron flipOpenCyclesToReady failed:', err));
  });

  cron.schedule('*/15 * * * *', () => {
    archiveRevealedCycles().catch((err) => logger.error('Cron archiveRevealedCycles failed:', err));
  });

  logger.info('✅ Cron jobs scheduled');
}
