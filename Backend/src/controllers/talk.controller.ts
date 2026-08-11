import { Request, Response } from 'express';
import { Talk } from '../models/Talk.model';
import { Notification } from '../models/Notification.model';
import { Pact } from '../models/Pact.model';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const scheduleTalk = asyncHandler(async (req: Request, res: Response) => {
  const { scheduledFor, agendaEntryIds } = req.body;

  const talk = await Talk.create({
    pactId: req.pactId,
    scheduledFor,
    agendaEntryIds,
  });

  const pact = await Pact.findById(req.pactId);
  const partnerId = pact?.partners.find((id) => id.toString() !== req.user!._id.toString());
  if (partnerId) {
    await Notification.create({
      userId: partnerId,
      kind: 'talk_scheduled',
      payload: { talkId: talk._id, scheduledFor },
    });
  }

  res.status(201).json(new ApiResponse(201, 'Talk scheduled', talk));
});

export const listTalks = asyncHandler(async (req: Request, res: Response) => {
  const talks = await Talk.find({ pactId: req.pactId }).sort({ scheduledFor: -1 }).limit(50);
  res.json(new ApiResponse(200, 'Talks', talks));
});
