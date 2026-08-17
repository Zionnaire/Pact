import { Request, Response } from 'express';
import { Entry } from '../models/Entry.model';
import { EntryReaction } from '../models/EntryReaction.model';
import { Cycle } from '../models/Cycle.model';
import { Pact } from '../models/Pact.model';
import { Notification } from '../models/Notification.model';
import { Session } from '../models/Session.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { sendPushNotifications } from '../configs/expoPush';
import { transcribeEntryAudio } from '../services/transcription.service';

async function loadOpenCycleOrThrow(pactId: string) {
  const pact = await Pact.findById(pactId);
  if (!pact) throw ApiError.notFound('Pact not found');
  if (pact.status === 'paused') throw ApiError.forbidden('This pact is paused — no new entries right now');
  if (pact.status === 'ended') throw ApiError.forbidden('This pact has ended — start or join a new one to keep dropping entries');

  const cycle = pact.currentCycleId ? await Cycle.findById(pact.currentCycleId) : null;
  if (!cycle || cycle.status !== 'open') {
    throw ApiError.conflict('The current cycle is not open for new entries');
  }
  return { pact, cycle };
}

function findPartnerId(pact: { partners: { toString(): string }[] }, authorId: string) {
  return pact.partners.find((id) => id.toString() !== authorId);
}

async function notifyPartnerOfDrop(pactId: string, authorId: string, cycleId: string) {
  const pact = await Pact.findById(pactId);
  if (!pact) return;
  const partnerId = findPartnerId(pact, authorId);
  if (!partnerId) return;

  const totalCount = await Entry.countDocuments({ cycleId });

  await Notification.create({
    userId: partnerId,
    kind: 'partner_drop',
    payload: { cycleId, count: totalCount },
  });

  const sessions = await Session.find({ userId: partnerId, expoPushToken: { $exists: true }, revokedAt: null });
  await sendPushNotifications(
    sessions.map((s) => ({
      to: s.expoPushToken as string,
      title: 'Your partner dropped an entry',
      body: 'Sealed until reveal — nothing to read yet.',
      data: { cycleId },
    })),
  );
}

// Urgent drops fire a SEPARATE, content-free nudge on top of the normal
// partner_drop notification — the point is "please make time to talk soon,"
// never a preview of what was actually written.
async function notifyPartnerOfUrgentDrop(pactId: string, authorId: string) {
  const pact = await Pact.findById(pactId);
  if (!pact) return;
  const partnerId = findPartnerId(pact, authorId);
  if (!partnerId) return;

  await Notification.create({ userId: partnerId, kind: 'urgent_drop', payload: { pactId } });

  const sessions = await Session.find({ userId: partnerId, expoPushToken: { $exists: true }, revokedAt: null });
  await sendPushNotifications(
    sessions.map((s) => ({
      to: s.expoPushToken as string,
      title: 'Your partner marked something urgent',
      body: 'Nothing to read yet — but they could use time together soon.',
      data: { pactId },
    })),
  );
}

export const createEntry = asyncHandler(async (req: Request, res: Response) => {
  const { pact, cycle } = await loadOpenCycleOrThrow(req.pactId!);
  const { type, body, mood, intensity, dropMode } = req.body;

  if (!body) {
    throw ApiError.badRequest('body is required for a text entry — use POST /entries/voice for voice notes');
  }

  const entry = await Entry.create({
    cycleId: cycle._id,
    pactId: pact._id,
    authorId: req.user!._id,
    type,
    body,
    mood,
    intensity,
    dropMode,
  });

  await notifyPartnerOfDrop(pact._id.toString(), req.user!._id.toString(), cycle._id.toString());
  if (dropMode === 'urgent') {
    await notifyPartnerOfUrgentDrop(pact._id.toString(), req.user!._id.toString());
  }

  res.status(201).json(new ApiResponse(201, 'Entry dropped', entry));
});

export const createVoiceEntry = asyncHandler(async (req: Request, res: Response) => {
  const { pact, cycle } = await loadOpenCycleOrThrow(req.pactId!);
  const { type, mood, intensity, dropMode } = req.body;

  if (!req.cloudinaryUrl) {
    throw ApiError.badRequest('No audio file uploaded');
  }

  const entry = await Entry.create({
    cycleId: cycle._id,
    pactId: pact._id,
    authorId: req.user!._id,
    type,
    mood,
    intensity: Number(intensity),
    dropMode: dropMode || 'standard',
    audioUrl: req.cloudinaryUrl,
    audioPublicId: req.cloudinaryPublicId,
    transcriptStatus: 'pending',
  });

  await notifyPartnerOfDrop(pact._id.toString(), req.user!._id.toString(), cycle._id.toString());
  if (entry.dropMode === 'urgent') {
    await notifyPartnerOfUrgentDrop(pact._id.toString(), req.user!._id.toString());
  }

  // Fire-and-forget — never blocks the response, never fails the drop.
  transcribeEntryAudio(entry._id.toString()).catch(() => undefined);

  res.status(201).json(new ApiResponse(201, 'Voice entry dropped', entry));
});

export const updateEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await Entry.findOne({ _id: req.params.id, authorId: req.user!._id });
  if (!entry) throw ApiError.notFound('Entry not found');

  const cycle = await Cycle.findById(entry.cycleId);
  if (!cycle || cycle.status !== 'open') {
    throw ApiError.forbidden('This entry is locked — its cycle is no longer open');
  }

  const { body, mood, intensity } = req.body;
  if (body !== undefined) entry.body = body;
  if (mood !== undefined) entry.mood = mood;
  if (intensity !== undefined) entry.intensity = intensity;
  entry.editedAt = new Date();
  await entry.save();

  res.json(new ApiResponse(200, 'Entry updated', entry));
});

export const deleteEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await Entry.findOne({ _id: req.params.id, authorId: req.user!._id });
  if (!entry) throw ApiError.notFound('Entry not found');

  const cycle = await Cycle.findById(entry.cycleId);
  if (!cycle || cycle.status !== 'open') {
    throw ApiError.forbidden('This entry is locked — its cycle is no longer open');
  }

  await entry.deleteOne();
  res.json(new ApiResponse(200, 'Entry deleted', null));
});

export const getMyEntries = asyncHandler(async (req: Request, res: Response) => {
  const cycleId = typeof req.query.cycleId === 'string' ? req.query.cycleId : undefined;
  const filter: Record<string, unknown> = { authorId: req.user!._id, pactId: req.pactId };
  if (cycleId) filter.cycleId = cycleId;

  const limit = Math.min(Number(req.query.limit) || 200, 200);
  const entries = await Entry.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json(new ApiResponse(200, 'Your entries', entries));
});

/**
 * Everything you wrote, everywhere, regardless of pact/reveal status —
 * scoped to authorId only, not req.pactId, so leaving or deleting your
 * account doesn't cut you off from your own words first. This is the
 * "leave with your own record intact" safety valve: no partner
 * involvement, no approval needed, works even mid-cycle before anything's
 * been revealed to anyone.
 */
export const exportMyData = asyncHandler(async (req: Request, res: Response) => {
  const entries = await Entry.find({ authorId: req.user!._id })
    .select('-audioPublicId')
    .sort({ createdAt: 1 });

  res.json(new ApiResponse(200, 'Your data export', {
    exportedAt: new Date(),
    entryCount: entries.length,
    entries,
  }));
});

export const setReaction = asyncHandler(async (req: Request, res: Response) => {
  const entry = await Entry.findOne({ _id: req.params.id, pactId: req.pactId });
  if (!entry) throw ApiError.notFound('Entry not found');

  const cycle = await Cycle.findById(entry.cycleId);
  if (!cycle || (cycle.status !== 'revealed' && cycle.status !== 'archived')) {
    throw ApiError.forbidden('This entry has not been revealed yet');
  }

  const { reaction } = req.body;
  const doc = await EntryReaction.findOneAndUpdate(
    { entryId: entry._id, userId: req.user!._id },
    { entryId: entry._id, pactId: entry.pactId, userId: req.user!._id, reaction },
    { upsert: true, new: true },
  );

  res.json(new ApiResponse(200, 'Reaction saved', doc));
});
