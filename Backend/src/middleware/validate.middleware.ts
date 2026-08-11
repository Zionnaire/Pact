/**
 * middleware/validate.middleware.ts
 * Validates req.body/query/params against a zod schema, replacing the raw
 * input with the parsed (typed, coerced, defaulted) result.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(ApiError.badRequest('Validation failed', result.error.issues));
      return;
    }
    req[target] = result.data;
    next();
  };
}
