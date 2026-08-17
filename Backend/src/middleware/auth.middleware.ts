/**
 * middleware/auth.middleware.ts
 * Verifies JWT access token on protected routes.
 * Attaches req.user (full user doc, minus secrets) and req.pactId.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const authMiddleware = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No bearer token provided');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or account is inactive');
    }

    req.user = user;
    req.pactId = user.pactId?.toString();
    req.sessionId = decoded.sessionId;
    next();
  },
);

/** Guards routes that require the user to already be paired to a pact. */
export const requirePairedPact = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.pactId) {
    throw ApiError.forbidden('This action requires an active pact');
  }
  next();
};

/**
 * Guards dropping entries specifically — a "quick join" account
 * (pact.controller.ts quickJoinInvite) has real login credentials on
 * neither email/phone nor a chosen password, so writing sealed content
 * into it risks the entries becoming unrecoverable the moment the session
 * is lost. Everything else in the app (looking around, seeing the pact,
 * settings) stays reachable — only the write path is gated.
 */
export const requireCompleteProfile = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user!.profileComplete) {
    throw ApiError.forbidden('Complete your profile (set an email/phone and password) before dropping entries');
  }
  next();
};
