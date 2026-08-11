/**
 * middleware/therapistAuth.middleware.ts
 * Therapists have no User account (see Pact_System_Design.md §7). Access is
 * a signed magic-link JWT scoped to a single TherapistGrant, verified here
 * instead of the normal authMiddleware.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyTherapistToken } from '../utils/generateToken';
import { TherapistGrant } from '../models/TherapistGrant.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const therapistAuthMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No therapist token provided');
    }

    let decoded;
    try {
      decoded = verifyTherapistToken(authHeader.split(' ')[1]);
    } catch {
      throw ApiError.unauthorized('Invalid or expired therapist link');
    }

    const grant = await TherapistGrant.findById(decoded.grantId);
    if (!grant || grant.revokedAt || grant.expiresAt < new Date()) {
      throw ApiError.unauthorized('This therapist link has expired or been revoked');
    }

    req.therapistGrant = grant;
    req.pactId = grant.pactId.toString();
    next();
  },
);
