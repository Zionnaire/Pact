import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cycle, ICycle, MAX_REVEAL_DELAYS_PER_CYCLE, REVEAL_DELAY_HOURS } from '../models/Cycle.model';
import { Pact } from '../models/Pact.model';
import { RevealConsent } from '../models/RevealConsent.model';
import { Entry } from '../models/Entry.model';
import { EntryReaction } from '../models/EntryReaction.model';
import { Response as EntryResponse } from '../models/Response.model';
import { Resolution } from '../models/Resolution.model';
import { Notification } from '../models/Notification.model';
import { Session } from '../models/Session.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { computeCycleRevealAt } from '../utils/cycleSchedule';
import { getIO, clearRevealReadyState } from '../configs/socket';
import { sendPushNotifications } from '../configs/expoPush';
import { logger } from '../utils/logger';

async function loadCycleForPactOrThrow(cycleId: string, pactId: string): Promise<ICycle> {
  const cycle = await Cycle.findById(cycleId);
  if (!cycle) throw ApiError.notFound('Cycle not found');
  if (cycle.pactId.toString() !== pactId) throw ApiError.forbidden('Cycle does not belong to your pact');
  return cycle;
}

function emitSocketSafely(fn: () => void) {
  try {
    fn();
  } catch (err) {
    logger.warn('Socket emit skipped — Socket.IO not initialised:', err);
  }
}

export const toggleRevealConsent = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await loadCycleForPactOrThrow(req.params.id, req.pactId!);
  if (cycle.status !== 'ready') {
    throw ApiError.conflict('Reveal consent can only be given once the cycle is ready');
  }

  const { consent } = req.body as { consent: boolean };

  if (consent) {
    await RevealConsent.updateOne(
      { cycleId: cycle._id, userId: req.user!._id },
      { $setOnInsert: { consentedAt: new Date(), pactId: cycle.pactId } },
      { upsert: true },
    );
  } else {
    await RevealConsent.deleteOne({ cycleId: cycle._id, userId: req.user!._id });
  }

  const [consents, pact] = await Promise.all([
    RevealConsent.find({ cycleId: cycle._id }),
    Pact.findById(cycle.pactId),
  ]);
  const bothConsented = Boolean(pact) && consents.length >= pact!.partners.length;

  emitSocketSafely(() => {
    getIO().to(`pact:${cycle.pactId}`).emit('reveal:state', {
      readyUserIds: consents.map((c) => c.userId.toString()),
      bothReady: bothConsented,
    });
  });

  res.json(new ApiResponse(200, 'Consent updated', { consented: Boolean(consent), bothConsented }));
});

export const requestRevealDelay = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await loadCycleForPactOrThrow(req.params.id, req.pactId!);
  if (cycle.status !== 'ready') {
    throw ApiError.conflict('Only a cycle that is ready to reveal can be delayed');
  }
  if (cycle.delaysUsed >= MAX_REVEAL_DELAYS_PER_CYCLE) {
    throw ApiError.conflict(`You've used all ${MAX_REVEAL_DELAYS_PER_CYCLE} delays for this cycle`);
  }

  cycle.revealAt = new Date(cycle.revealAt.getTime() + REVEAL_DELAY_HOURS * 60 * 60 * 1000);
  cycle.delaysUsed += 1;
  await cycle.save();

  // Requesting a delay clears any consent already given — the reveal moment
  // just moved, so "I'm ready" needs to be re-affirmed for the new time.
  await RevealConsent.deleteMany({ cycleId: cycle._id });
  clearRevealReadyState(cycle.pactId.toString());

  const pact = await Pact.findById(cycle.pactId);
  if (pact) {
    const partnerId = pact.partners.find((id) => id.toString() !== req.user!._id.toString());
    if (partnerId) {
      await Notification.create({
        userId: partnerId,
        kind: 'reveal_delayed',
        payload: { cycleId: cycle._id, revealAt: cycle.revealAt },
      });
    }
  }

  emitSocketSafely(() => {
    getIO().to(`pact:${cycle.pactId}`).emit('reveal:state', { readyUserIds: [], bothReady: false });
  });

  res.json(new ApiResponse(200, 'Reveal delayed', cycle));
});

export const performReveal = asyncHandler(async (req: Request, res: Response) => {
  const cycleId = req.params.id;
  const session = await mongoose.startSession();
  let revealedCycle: ICycle | undefined;

  try {
    await session.withTransaction(async () => {
      const cycle = await Cycle.findById(cycleId).session(session);
      if (!cycle) throw ApiError.notFound('Cycle not found');
      if (cycle.pactId.toString() !== req.pactId) throw ApiError.forbidden('Cycle does not belong to your pact');
      if (cycle.status !== 'ready') throw ApiError.conflict('Cycle is not ready to reveal');
      if (cycle.revealAt > new Date()) throw ApiError.conflict('The reveal time has not arrived yet');

      const pact = await Pact.findById(cycle.pactId).session(session);
      if (!pact) throw ApiError.notFound('Pact not found');

      const consentCount = await RevealConsent.countDocuments({ cycleId: cycle._id }).session(session);
      if (consentCount < pact.partners.length) {
        throw ApiError.conflict('Both partners must consent before the reveal can happen');
      }

      cycle.status = 'revealed';
      cycle.revealedAt = new Date();
      await cycle.save({ session });

      const startsAt = new Date();
      const [nextCycle] = await Cycle.create(
        [{
          pactId: pact._id,
          index: cycle.index + 1,
          startsAt,
          revealAt: computeCycleRevealAt({
            timezone: pact.timezone,
            revealTime: pact.revealTime,
            startsAt,
            cycleLengthDays: pact.cycleLengthDays,
          }),
          status: 'open',
        }],
        { session },
      );

      pact.currentCycleId = nextCycle._id;
      await pact.save({ session });

      revealedCycle = cycle;
    });
  } finally {
    await session.endSession();
  }

  if (!revealedCycle) throw ApiError.internal('Reveal failed unexpectedly');

  clearRevealReadyState(revealedCycle.pactId.toString());
  emitSocketSafely(() => {
    getIO().to(`pact:${revealedCycle!.pactId}`).emit('reveal:open', { cycleId: revealedCycle!._id });
  });

  const pact = await Pact.findById(revealedCycle.pactId);
  if (pact) {
    await Notification.insertMany(
      pact.partners.map((userId) => ({
        userId,
        kind: 'reveal_completed',
        payload: { cycleId: revealedCycle!._id },
      })),
    );
    const sessions = await Session.find({
      userId: { $in: pact.partners },
      expoPushToken: { $exists: true },
      revokedAt: null,
    });
    await sendPushNotifications(
      sessions.map((s) => ({
        to: s.expoPushToken as string,
        title: 'The vault is unlocked',
        body: "This cycle's entries are ready to read together.",
        data: { cycleId: String(revealedCycle!._id) },
      })),
    );
  }

  res.json(new ApiResponse(200, 'Cycle revealed', revealedCycle));
});

export const getRevealedCycle = asyncHandler(async (req: Request, res: Response) => {
  const cycle = await loadCycleForPactOrThrow(req.params.id, req.pactId!);
  if (cycle.status !== 'revealed' && cycle.status !== 'archived') {
    throw ApiError.forbidden('This cycle has not been revealed yet');
  }

  const entries = await Entry.find({ cycleId: cycle._id }).sort({ createdAt: 1 });
  const entryIds = entries.map((e) => e._id);

  const [responses, resolutions, reactions] = await Promise.all([
    EntryResponse.find({ entryId: { $in: entryIds } }),
    Resolution.find({ entryId: { $in: entryIds } }),
    EntryReaction.find({ entryId: { $in: entryIds } }),
  ]);

  const responsesByEntry = new Map<string, typeof responses>();
  for (const r of responses) {
    const key = r.entryId.toString();
    responsesByEntry.set(key, [...(responsesByEntry.get(key) || []), r]);
  }
  const resolutionByEntry = new Map(resolutions.map((r) => [r.entryId.toString(), r]));
  const reactionsByEntry = new Map<string, typeof reactions>();
  for (const r of reactions) {
    const key = r.entryId.toString();
    reactionsByEntry.set(key, [...(reactionsByEntry.get(key) || []), r]);
  }

  // Anonymous entries hide *who* dropped them from the partner — not from
  // the author themselves, who should still see their own entry as theirs.
  const enriched = entries.map((entry) => {
    const isAnonymous = entry.dropMode === 'anonymous';
    const viewingOwnEntry = entry.authorId.toString() === req.user!._id.toString();
    const entryJson = entry.toJSON() as Record<string, unknown>;
    if (isAnonymous && !viewingOwnEntry) {
      entryJson.authorId = null;
    }

    return {
      entry: entryJson,
      isAnonymous,
      responses: responsesByEntry.get(entry._id.toString()) || [],
      resolution: resolutionByEntry.get(entry._id.toString()) || null,
      reactions: reactionsByEntry.get(entry._id.toString()) || [],
    };
  });

  res.json(new ApiResponse(200, 'Revealed cycle', { cycle, entries: enriched }));
});
