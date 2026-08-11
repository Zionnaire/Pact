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
