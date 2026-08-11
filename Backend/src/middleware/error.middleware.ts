/**
 * middleware/error.middleware.ts
 * Global Express error handler — must be the LAST middleware in app.ts.
 * Catches all errors forwarded via next(err) or thrown in asyncHandler.
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { config } from '../configs/config';
import { logger } from '../utils/logger';

interface MongoServerErrorLike extends Error {
  code?: number;
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, {
    stack: err.stack,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation error',
      errors: [err.message],
    });
    return;
  }

  // Mongoose/MongoDB duplicate key — err.code is a NUMBER (11000), not a string.
  if ((err as MongoServerErrorLike).code === 11000) {
    res.status(409).json({
      success: false,
      statusCode: 409,
      message: 'Duplicate entry — resource already exists',
      errors: [],
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false, statusCode: 401, message: 'Invalid token', errors: [],
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false, statusCode: 401, message: 'Token expired', errors: [],
    });
    return;
  }

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    errors: [],
  });
}
