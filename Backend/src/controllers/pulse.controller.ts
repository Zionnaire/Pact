import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { computePactPulse } from '../services/pulse.service';

export const getPulse = asyncHandler(async (req: Request, res: Response) => {
  const summary = await computePactPulse(req.pactId!);
  res.json(new ApiResponse(200, 'Pulse', summary));
});
