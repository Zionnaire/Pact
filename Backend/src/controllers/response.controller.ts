import { Request, Response as ExpressResponse } from 'express';
import { Entry } from '../models/Entry.model';
import { Cycle } from '../models/Cycle.model';
import { Response as EntryResponse } from '../models/Response.model';
import { Resolution } from '../models/Resolution.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

async function loadRevealedEntryOrThrow(entryId: string, pactId: string) {
  const entry = await Entry.findOne({ _id: entryId, pactId });
  if (!entry) throw ApiError.notFound('Entry not found');

  const cycle = await Cycle.findById(entry.cycleId);
  if (!cycle || (cycle.status !== 'revealed' && cycle.status !== 'archived')) {
    throw ApiError.forbidden('This entry has not been revealed yet');
  }
  return entry;
}

export const respondToEntry = asyncHandler(async (req: Request, res: ExpressResponse) => {
  const entry = await loadRevealedEntryOrThrow(req.params.id, req.pactId!);
  const { body, reaction } = req.body;

  const response = await EntryResponse.create({
    entryId: entry._id,
    pactId: entry.pactId,
    responderId: req.user!._id,
    body,
    reaction,
  });

  res.status(201).json(new ApiResponse(201, 'Response added', response));
});

export const setResolution = asyncHandler(async (req: Request, res: ExpressResponse) => {
  const entry = await loadRevealedEntryOrThrow(req.params.id, req.pactId!);
  const { status } = req.body;

  const resolution = await Resolution.findOneAndUpdate(
    { entryId: entry._id },
    {
      entryId: entry._id,
      pactId: entry.pactId,
      status,
      resolvedAt: status === 'resolved' ? new Date() : undefined,
    },
    { upsert: true, new: true },
  );

  res.json(new ApiResponse(200, 'Resolution updated', resolution));
});
