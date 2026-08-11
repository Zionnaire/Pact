import { Request, Response } from 'express';
import { Notification } from '../models/Notification.model';
import { Session } from '../models/Session.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(new ApiResponse(200, 'Notifications', notifications));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!notification) throw ApiError.notFound('Notification not found');

  notification.readAt = new Date();
  await notification.save();

  res.json(new ApiResponse(200, 'Notification marked read', notification));
});

export const registerPushToken = asyncHandler(async (req: Request, res: Response) => {
  const { expoPushToken, deviceId, platform } = req.body;

  await Session.updateOne(
    { userId: req.user!._id, deviceId },
    { $set: { expoPushToken, platform, lastUsedAt: new Date() } },
    { upsert: false },
  );

  res.json(new ApiResponse(200, 'Push token registered', null));
});
