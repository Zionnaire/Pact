/**
 * middleware/adminAuth.middleware.ts
 * Static shared-secret gate for operator-only routes (manual subscription
 * grants, etc). Deliberately simple — replace with real admin accounts if
 * this surface grows beyond a couple of one-off actions.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../configs/config';
import { ApiError } from '../utils/ApiError';

export function adminAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!config.adminSecret) {
    throw ApiError.notImplemented('ADMIN_SECRET is not configured on this server');
  }
  if (req.headers['x-admin-secret'] !== config.adminSecret) {
    throw ApiError.unauthorized('Invalid admin secret');
  }
  next();
}
