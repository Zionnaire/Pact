import { Request, Response } from 'express';
import { Pact } from '../models/Pact.model';
import { Cycle } from '../models/Cycle.model';
import { Invite } from '../models/Invite.model';
import { Subscription } from '../models/Subscription.model';
import { Notification } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateInviteCode } from '../utils/inviteCode';
import { computeCycleRevealAt } from '../utils/cycleSchedule';
import { config } from '../configs/config';
import { sendInviteSms, twilioEnabled } from '../configs/twilio';
import { sendEmail, emailEnabled } from '../configs/email';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const createPact = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.pactId) {
    throw ApiError.conflict('You are already paired to a pact');
  }

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
  if (req.user!.pactId) {
    throw ApiError.conflict('You are already paired to a pact');
  }

  const { code } = req.params;
  const invite = await Invite.findOne({ code, acceptedAt: null, expiresAt: { $gt: new Date() } });
  if (!invite) {
    throw ApiError.notFound('This invite is invalid or has expired');
  }

  const pact = await Pact.findById(invite.pactId);
  if (!pact || pact.partners.length >= 2) {
    throw ApiError.conflict('This pact is no longer accepting a new partner');
  }
  if (pact.partners.some((id) => id.equals(req.user!._id))) {
    throw ApiError.conflict('You are already a member of this pact');
  }

  pact.partners.push(req.user!._id);
  await pact.save();

  req.user!.pactId = pact._id;
  await req.user!.save();

  invite.acceptedAt = new Date();
  invite.acceptedBy = req.user!._id;
  await invite.save();

  res.json(new ApiResponse(200, 'Pact joined', pact));
});

export const pauseCycle = asyncHandler(async (req: Request, res: Response) => {
  const pact = await Pact.findById(req.pactId);
  if (!pact) throw ApiError.notFound('Pact not found');

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

  pact.status = 'active';
  pact.pausedAt = undefined;
  pact.pausedBy = undefined;
  await pact.save();

  res.json(new ApiResponse(200, 'Pact resumed', pact));
});
