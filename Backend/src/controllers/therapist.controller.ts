import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { TherapistGrant } from '../models/TherapistGrant.model';
import { Resolution } from '../models/Resolution.model';
import { Pact } from '../models/Pact.model';
import { Notification } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateTherapistToken } from '../utils/generateToken';
import { computePactPulse } from '../services/pulse.service';
import { config } from '../configs/config';

/**
 * Themes/pulse/resolution data reflects BOTH partners, not just the
 * granter — so unlike a purely personal action (pausing, deleting your own
 * account), sharing it with a third party can't be unilateral-and-silent
 * without reproducing the exact asymmetric-visibility pattern this app
 * exists to avoid. We don't block the grant (that would let a controlling
 * partner veto the other's access to counseling support, which is its own
 * risk) — we make it impossible to hide: the other partner is always
 * notified, and either partner can revoke it (see revokeTherapistAccess).
 * A genuinely private escape valve already exists — Safety & support's
 * crisis resources are never logged or shared with the partner at all.
 */
export const grantTherapistAccess = asyncHandler(async (req: Request, res: Response) => {
  const { therapistEmail, scopes, expiresInDays } = req.body;

  const grant = await TherapistGrant.create({
    pactId: req.pactId,
    grantedBy: req.user!._id,
    therapistEmail,
    scopes,
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
  });

  const token = generateTherapistToken(
    { scope: 'therapist', pactId: req.pactId!, grantId: grant._id.toString(), email: therapistEmail },
    `${expiresInDays}d`,
  );

  const pact = await Pact.findById(req.pactId);
  const partnerId = pact?.partners.find((id) => !id.equals(req.user!._id));
  if (partnerId) {
    await Notification.create({
      userId: partnerId,
      kind: 'therapist_granted',
      payload: { pactId: req.pactId, grantId: grant._id, therapistEmail, scopes, grantedBy: req.user!._id },
    });
  }

  res.status(201).json(new ApiResponse(201, 'Therapist access granted', {
    grant,
    portalLink: `${config.appDeepLink}/therapist/${token}`,
  }));
});

export const listTherapistGrants = asyncHandler(async (req: Request, res: Response) => {
  const grants = await TherapistGrant.find({ pactId: req.pactId }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, 'Therapist grants', grants));
});

export const revokeTherapistAccess = asyncHandler(async (req: Request, res: Response) => {
  // Deliberately not scoped to `grantedBy` — either partner can revoke a
  // grant regardless of who created it, same as either partner can pause
  // the pact. Revocation should never require the granter's permission.
  const grant = await TherapistGrant.findOne({ _id: req.params.id, pactId: req.pactId });
  if (!grant) throw ApiError.notFound('Grant not found');

  grant.revokedAt = new Date();
  await grant.save();

  const pact = await Pact.findById(req.pactId);
  const otherPartnerId = pact?.partners.find((id) => !id.equals(req.user!._id));
  if (otherPartnerId) {
    await Notification.create({
      userId: otherPartnerId,
      kind: 'therapist_revoked',
      payload: { pactId: req.pactId, grantId: grant._id, therapistEmail: grant.therapistEmail, revokedBy: req.user!._id },
    });
  }

  res.json(new ApiResponse(200, 'Therapist access revoked', grant));
});

export const getTherapistSummary = asyncHandler(async (req: Request, res: Response) => {
  const grant = req.therapistGrant!;
  const summary = await computePactPulse(req.pactId!);

  const resolutionCounts = await Resolution.aggregate([
    { $match: { pactId: new Types.ObjectId(req.pactId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const response: Record<string, unknown> = {};
  if (grant.scopes.includes('summary')) {
    response.score = summary.score;
    response.resolutionRate = summary.resolutionRate;
    response.distribution = summary.distribution;
    response.resolutionCounts = resolutionCounts;
  }
  if (grant.scopes.includes('themes')) {
    response.themes = summary.themes;
  }
  if (grant.scopes.includes('pulse_history')) {
    response.history = summary.history;
  }

  res.json(new ApiResponse(200, 'Therapist summary', response));
});
