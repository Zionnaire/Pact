import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { TherapistGrant } from '../models/TherapistGrant.model';
import { Resolution } from '../models/Resolution.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { generateTherapistToken } from '../utils/generateToken';
import { computePactPulse } from '../services/pulse.service';
import { config } from '../configs/config';

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
  const grant = await TherapistGrant.findOne({ _id: req.params.id, pactId: req.pactId });
  if (!grant) throw ApiError.notFound('Grant not found');

  grant.revokedAt = new Date();
  await grant.save();

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
