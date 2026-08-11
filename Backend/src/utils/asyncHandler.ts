/**
 * utils/asyncHandler.ts
 * Wraps an async Express handler so rejected promises reach errorMiddleware
 * via next(err) instead of crashing the process.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
