import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { Pact, IPact } from '../models/Pact.model';
import { Cycle } from '../models/Cycle.model';
import { Invite } from '../models/Invite.model';
import { Subscription } from '../models/Subscription.model';
import { Notification } from '../models/Notification.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInviteCode } from '../utils/inviteCode';
import { computeCycleRevealAt } from '../utils/cycleSchedule';
import { endPactForUser, clearStalePactId } from '../utils/pactLifecycle';
import { config } from '../configs/config';
import { sendInviteSms, twilioEnabled } from '../configs/twilio';
import { sendEmail, emailEnabled } from '../configs/email';
import { issueTokensForSession, sanitizeUser } from './auth.controller';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Atomically adds `userId` to `pact.partners` — a plain read-then-push
 * (read pact, check length client-side, then save) has a real TOCTOU race
 * if two accept requests for the same invite land concurrently, both
 * reading "1 partner" before either write commits. This folds the
 * capacity + membership check into the update's filter itself, so Mongo
 * only applies the $push if both are still true at write time.
 */
async function joinPactAtomically(pactId: Types.ObjectId, userId: Types.ObjectId): Promise<IPact | null> {
  return Pact.findOneAndUpdate(
    {
      _id: pactId,
      $expr: { $lt: [{ $size: '$partners' }, 2] },
      partners: { $ne: userId },
    },
    { $push: { partners: userId } },
    { new: true },
  );
}

/**
 * A pactId pointing at an already-`ended` pact (partner left, or deleted
 * their account) shouldn't block starting or joining a new one — only a
 * genuinely live pact should. Silently clears it in that case; still
 * blocks on a real active/paused pact.
 */
async function ensureNotStuckInEndedPact(userId: Types.ObjectId, currentPactId?: Types.ObjectId): Promise<void> {
  if (!currentPactId) return;
  const current = await Pact.findById(currentPactId);
  if (!current || current.status === 'ended') {
    await clearStalePactId(userId);
    return;
  }
  throw ApiError.conflict('You are already paired to a pact');
}

export const createPact = asyncHandler(async (req: Request, res: Response) => {
  await ensureNotStuckInEndedPact(req.user!._id, req.user!.pactId);

  const { name, cycleLengthDays, revealDay, revealTime, timezone, intentions } = req.body;

  const pact = await Pact.create({
    name,
    partners: [req.user!._id],
    cycleLengthDays,
    revealDay,
    revealTime,
    timezone,
    intentions,
  });

  const startsAt = new Date();
  const cycle = await Cycle.create({
    pactId: pact._id,
    index: 0,
    startsAt,
    revealAt: computeCycleRevealAt({ timezone, revealTime, startsAt, cycleLengthDays }),
    status: 'open',
  });

  pact.currentCycleId = cycle._id;
  await pact.save();

  await Subscription.create({ pactId: pact._id, tier: 'free', status: 'active' });

  req.user!.pactId = pact._id;
  await req.user!.save();

  res.status(201).json(new ApiResponse(201, 'Pact created', { pact, cycle }));
});

export const getMyPact = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId).populate('partners', 'displayName avatarUrl avatarInitial');
  if (!pact) throw ApiError.notFound('Pact not found');
  res.json(new ApiResponse(200, 'Pact', pact));
});

export const updatePact = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');
  if (pact.status === 'ended') throw ApiError.conflict('This pact has ended — start or join a new one');

  const { name, cycleLengthDays, revealDay, revealTime, timezone, cycleName } = req.body;

  const cadenceChanged = [cycleLengthDays, revealDay, revealTime, timezone].some((v) => v !== undefined);

  if (name !== undefined) pact.name = name;
  if (cycleLengthDays !== undefined) pact.cycleLengthDays = cycleLengthDays;
  if (revealDay !== undefined) pact.revealDay = revealDay;
  if (revealTime !== undefined) pact.revealTime = revealTime;
  if (timezone !== undefined) pact.timezone = timezone;
  await pact.save();

  const cycle = pact.currentCycleId ? await Cycle.findById(pact.currentCycleId) : null;
  if (cycle) {
    if (cycleName !== undefined) cycle.name = cycleName;
    // Only an still-open cycle's reveal time is safe to reschedule — once
    // it's 'ready' or later, partners may already be mid-consent.
    if (cadenceChanged && cycle.status === 'open') {
      cycle.revealAt = computeCycleRevealAt({
        timezone: pact.timezone,
        revealTime: pact.revealTime,
        startsAt: cycle.startsAt,
        cycleLengthDays: pact.cycleLengthDays,
      });
    }
    await cycle.save();
  }

  res.json(new ApiResponse(200, 'Pact updated', { pact, cycle }));
});

export const createInvite = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');
  if (pact.status === 'ended') throw ApiError.conflict('This pact has ended — start or join a new one');
  if (pact.partners.length >= 2) {
    throw ApiError.conflict('This pact already has two partners');
  }

  const { channel, phone, email } = req.body;

  if (channel === 'sms' && !twilioEnabled) {
    throw ApiError.notImplemented('SMS invites are not configured on this server — use the link channel instead');
  }
  if (channel === 'email' && !emailEnabled) {
    throw ApiError.notImplemented('Email invites are not configured on this server — use the link channel instead');
  }

  const invite = await Invite.create({
    pactId: pact._id,
    inviterId: req.user!._id,
    code: generateInviteCode(),
    channel,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  const inviteLink = `${config.appDeepLink}/invite/${invite.code}`;

  if (channel === 'sms') {
    await sendInviteSms(phone, `${req.user!.displayName} invited you to Pact. Join: ${inviteLink}`);
  }
  if (channel === 'email') {
    await sendEmail({
      to: email,
      subject: `${req.user!.displayName} invited you to Pact`,
      html: `<p>${req.user!.displayName} wants to start a Pact with you — a private, sealed journal for the two of you.</p>
        <p>Your invite code: <strong style="letter-spacing:2px">${invite.code}</strong></p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>This invite expires in 7 days.</p>`,
    });
  }

  res.status(201).json(new ApiResponse(201, 'Invite created', { invite, inviteLink }));
});

export const listInvites = asyncHandler(async (req: Request, res: Response) => {
  const invites = await Invite.find({ pactId: req.pactId, acceptedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, 'Pending invites', invites));
});

export const cancelInvite = asyncHandler(async (req: Request, res: Response) => {
  const invite = await Invite.findOne({ _id: req.params.id, pactId: req.pactId, acceptedAt: null });
  if (!invite) throw ApiError.notFound('Invite not found');

  await invite.deleteOne();
  res.json(new ApiResponse(200, 'Invite cancelled', null));
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  await ensureNotStuckInEndedPact(req.user!._id, req.user!.pactId);

  const { code } = req.params;
  const invite = await Invite.findOne({ code, acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invite) {
    throw ApiError.notFound('This invite is invalid or has expired');
  }

  const pact = await joinPactAtomically(invite.pactId, req.user!._id);
  if (!pact) {
    throw ApiError.conflict('This pact is no longer accepting a new partner, or you already joined it');
  }

  req.user!.pactId = pact._id;
  await req.user!.save();

  invite.acceptedAt = new Date();
  invite.acceptedBy = req.user!._id;
  await invite.save();

  res.json(new ApiResponse(200, 'Pact joined', pact));
});

/**
 * Voluntarily leaving a live pact — distinct from full account deletion.
 * Keeps your identity and history; only ends the pact itself, via the same
 * cascade deleteAccount uses (auth.controller.ts), so you're free to pact
 * with someone else afterward. If the pact already ended some other way
 * (partner beat you to it), this is just a no-op cleanup of your own
 * pactId — nothing left to cascade.
 */
export const leavePact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.pactId) {
    throw ApiError.conflict('You are not currently in a pact');
  }

  const pact = await Pact.findById(req.user!.pactId);
  if (pact && pact.status !== 'ended') {
    await endPactForUser(pact, req.user!._id);
  }

  await clearStalePactId(req.user!._id);

  res.json(new ApiResponse(200, 'You left the pact', null));
});

/**
 * Lets someone accept an invite WITHOUT an existing account — collects
 * only a display name, creates a minimal account (profileComplete: false,
 * an unusable random password so nobody else can log into it, no
 * email/phone), pairs them immediately, and logs them in on this device.
 * They can look around freely; entry.routes.ts's requireCompleteProfile
 * blocks dropping entries until they set real, recoverable credentials via
 * POST /auth/me/complete-profile — protects them from writing sealed
 * content into an account that (without a password/email) only this one
 * device's session can ever reach.
 */
export const quickJoinInvite = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const { displayName, deviceId, platform, appVersion, expoPushToken } = req.body;

  const invite = await Invite.findOne({ code, acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invite) {
    throw ApiError.notFound('This invite is invalid or has expired');
  }

  const pactBeforeJoin = await Pact.findById(invite.pactId);
  if (!pactBeforeJoin || pactBeforeJoin.partners.length >= 2) {
    throw ApiError.conflict('This pact is no longer accepting a new partner');
  }

  const unusablePasswordHash = await bcrypt.hash(new Types.ObjectId().toString(), 10);
  const user = await User.create({
    displayName,
    avatarInitial: displayName.trim().charAt(0).toUpperCase(),
    passwordHash: unusablePasswordHash,
    profileComplete: false,
  });

  const pact = await joinPactAtomically(invite.pactId, user._id);
  if (!pact) {
    // Lost the race for the last slot — undo the account we just made rather than leave an orphan.
    await user.deleteOne();
    throw ApiError.conflict('This pact is no longer accepting a new partner');
  }

  user.pactId = pact._id;
  await user.save();

  invite.acceptedAt = new Date();
  invite.acceptedBy = user._id;
  await invite.save();

  const tokens = await issueTokensForSession({
    userId: user._id,
    pactId: pact._id,
    deviceId,
    platform,
    appVersion,
    expoPushToken,
  });

  res.status(201).json(new ApiResponse(201, 'Pact joined', { user: sanitizeUser(user), pact, ...tokens }));
});

export const pauseCycle = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');
  if (pact.status === 'ended') throw ApiError.conflict('This pact has already ended');

  pact.status = 'paused';
  pact.pausedAt = new Date();
  pact.pausedBy = req.user!._id;
  await pact.save();

  const partnerId = pact.partners.find((id) => !id.equals(req.user!._id));
  if (partnerId) {
    await Notification.create({
      userId: partnerId,
      kind: 'safety_pause',
      payload: { pactId: pact._id },
    });
  }

  res.json(new ApiResponse(200, 'Pact paused', pact));
});

export const resumeCycle = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');
  if (pact.status === 'ended') throw ApiError.conflict('This pact has already ended');

  pact.status = 'active';
  pact.pausedAt = undefined;
  pact.pausedBy = undefined;
  await pact.save();

  res.json(new ApiResponse(200, 'Pact resumed', pact));
});
