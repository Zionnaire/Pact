/**
 * controllers/auth.controller.ts
 * Register/login issue an access token (15m) + refresh token (30d, rotated
 * on every /auth/refresh call) backed by a Session row per device.
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, IUser } from '../models/User.model';
import { Session } from '../models/Session.model';
import { Pact } from '../models/Pact.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../configs/config';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/generateToken';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

function refreshExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

async function issueTokensForSession(params: {
  userId: Types.ObjectId;
  pactId?: Types.ObjectId;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  expoPushToken?: string;
}) {
  let session = await Session.findOne({ userId: params.userId, deviceId: params.deviceId });

  if (!session) {
    session = new Session({
      userId: params.userId,
      deviceId: params.deviceId,
      platform: params.platform,
      refreshTokenHash: 'pending',
      expiresAt: refreshExpiryDate(),
    });
  }

  session.revokedAt = undefined;
  session.appVersion = params.appVersion;
  if (params.expoPushToken) session.expoPushToken = params.expoPushToken;
  session.lastUsedAt = new Date();
  session.expiresAt = refreshExpiryDate();

  const pactIdStr = params.pactId?.toString();
  const accessToken = generateAccessToken({
    userId: params.userId.toString(),
    pactId: pactIdStr,
    sessionId: session._id.toString(),
  });
  const refreshToken = generateRefreshToken({
    userId: params.userId.toString(),
    pactId: pactIdStr,
    sessionId: session._id.toString(),
  });

  session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await session.save();

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresInMs: ACCESS_TOKEN_TTL_MS,
  };
}

function sanitizeUser(user: IUser) {
  return {
    id: user._id,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    avatarInitial: user.avatarInitial,
    pactId: user.pactId,
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { displayName, email, phone, password, deviceId, platform, appVersion, expoPushToken } = req.body;

  const existing = await User.findOne(email ? { email } : { phone });
  if (existing) {
    throw ApiError.conflict('An account with this email or phone already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    displayName,
    email,
    phone,
    passwordHash,
    avatarInitial: displayName.trim().charAt(0).toUpperCase(),
  });

  const tokens = await issueTokensForSession({
    userId: user._id,
    deviceId,
    platform,
    appVersion,
    expoPushToken,
  });

  res.status(201).json(new ApiResponse(201, 'Account created', { user: sanitizeUser(user), ...tokens }));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, deviceId, platform, appVersion, expoPushToken } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).select('+passwordHash');

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const tokens = await issueTokensForSession({
    userId: user._id,
    pactId: user.pactId,
    deviceId,
    platform,
    appVersion,
    expoPushToken,
  });

  res.json(new ApiResponse(200, 'Logged in', { user: sanitizeUser(user), ...tokens }));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken, deviceId } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const session = await Session.findById(decoded.sessionId).select('+refreshTokenHash');
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.deviceId !== deviceId) {
    throw ApiError.unauthorized('Session is no longer valid — please log in again');
  }

  const matches = await bcrypt.compare(refreshToken, session.refreshTokenHash);
  if (!matches) {
    // Reused/stolen refresh token — kill the session defensively.
    session.revokedAt = new Date();
    await session.save();
    throw ApiError.unauthorized('Session is no longer valid — please log in again');
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }

  const tokens = await issueTokensForSession({
    userId: user._id,
    pactId: user.pactId,
    deviceId: session.deviceId,
    platform: session.platform,
    appVersion: session.appVersion,
    expoPushToken: session.expoPushToken,
  });

  res.json(new ApiResponse(200, 'Token refreshed', tokens));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { deviceId } = req.body as { deviceId?: string };

  const filter = deviceId
    ? { userId: req.user!._id, deviceId }
    : { _id: req.sessionId };

  await Session.updateOne(filter, { revokedAt: new Date() });
  res.json(new ApiResponse(200, 'Logged out', null));
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await Session.updateMany(
    { userId: req.user!._id, revokedAt: null },
    { revokedAt: new Date() },
  );
  res.json(new ApiResponse(200, 'Logged out on all devices', null));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { displayName } = req.body as { displayName?: string };

  if (displayName) {
    req.user!.displayName = displayName;
    req.user!.avatarInitial = displayName.trim().charAt(0).toUpperCase();
  }
  await req.user!.save();

  res.json(new ApiResponse(200, 'Profile updated', sanitizeUser(req.user!)));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.cloudinaryUrl) {
    throw ApiError.badRequest('No image file uploaded');
  }

  req.user!.avatarUrl = req.cloudinaryUrl;
  await req.user!.save();

  res.json(new ApiResponse(200, 'Avatar updated', sanitizeUser(req.user!)));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const pact = req.user!.pactId ? await Pact.findById(req.user!.pactId) : null;
  res.json(new ApiResponse(200, 'Current session', { user: sanitizeUser(req.user!), pact }));
});

export const appConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse(200, 'App config', {
    transcriptionEnabled: config.transcription.enabled,
    paymentsEnabled: config.payments.enabled,
    aiEnabled: config.ai.enabled,
    smsInvitesEnabled: config.twilio.enabled,
  }));
});
