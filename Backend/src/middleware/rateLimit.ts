import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many requests, please try again later'));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many login attempts, please try again later'));
  },
});

// AI calls cost money per request — keep this tight regardless of the
// per-user daily cap enforced in the controller.
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many AI requests this hour, please try again later'));
  },
});

export const revealLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooMany('Too many reveal attempts, please slow down'));
  },
});
