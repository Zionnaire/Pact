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
import { Entry } from '../models/Entry.model';
import { Cycle } from '../models/Cycle.model';
import { Notification } from '../models/Notification.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../configs/config';
import { cloudinary } from '../configs/cloudinary';
import { sendEmail, emailEnabled } from '../configs/email';
import { logger } from '../utils/logger';
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
    bio: user.bio,
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
  const { displayName, bio } = req.body as { displayName?: string; bio?: string };

  if (displayName) {
    req.user!.displayName = displayName;
    req.user!.avatarInitial = displayName.trim().charAt(0).toUpperCase();
  }
  if (bio !== undefined) {
    req.user!.bio = bio;
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

/**
 * Google Play / Apple App Store both require in-app account deletion that
 * actually removes personal data, not just deactivation. We anonymize
 * rather than hard-delete the User document (keeps referential integrity
 * for the partner's already-revealed history — e.g. Entry.authorId,
 * Pact.partners), which satisfies "delete personal/sensitive data" while
 * not breaking the other partner's own past record. Anything never mutually
 * revealed (still 'open'/'ready') is hard-deleted outright, since it was
 * never consented to be seen and can now never be revealed.
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body as { password: string };

  const user = await User.findById(req.user!._id).select('+passwordHash');
  if (!user) throw ApiError.notFound('User not found');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Incorrect password');
  }

  if (user.pactId) {
    const pact = await Pact.findById(user.pactId);
    if (pact) {
      const unrevealedCycles = await Cycle.find({ pactId: pact._id, status: { $in: ['open', 'ready'] } }).select('_id');
      const unrevealedCycleIds = unrevealedCycles.map((c) => c._id);

      const ownUnrevealedEntries = await Entry.find({
        cycleId: { $in: unrevealedCycleIds },
        authorId: user._id,
      }).select('audioPublicId');

      for (const entry of ownUnrevealedEntries) {
        if (entry.audioPublicId) {
          await cloudinary.uploader.destroy(entry.audioPublicId, { resource_type: 'video' }).catch((err) => {
            logger.error(`Failed to delete Cloudinary audio ${entry.audioPublicId} during account deletion:`, err);
          });
        }
      }
      await Entry.deleteMany({ cycleId: { $in: unrevealedCycleIds }, authorId: user._id });

      pact.status = 'ended';
      await pact.save();

      const partnerId = pact.partners.find((id) => !id.equals(user._id));
      if (partnerId) {
        await Notification.create({
          userId: partnerId,
          kind: 'partner_left',
          payload: { pactId: pact._id },
        });
      }
    }
  }

  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  // Explicit $unset rather than assigning undefined + save() — Mongoose's
  // change-tracking on `= undefined` isn't reliable for clearing indexed
  // fields, and silently failing to clear email/phone here would mean the
  // "deletion" doesn't actually delete personal data.
  const unusablePasswordHash = await bcrypt.hash(new Types.ObjectId().toString(), 10);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { isActive: false, displayName: 'Deleted user', passwordHash: unusablePasswordHash },
      $unset: { email: '', phone: '', avatarUrl: '', pactId: '' },
    },
  );

  res.json(new ApiResponse(200, 'Account deleted', null));
});

const PASSWORD_RESET_CODE_TTL_MS = 15 * 60 * 1000;

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.body as { identifier: string };

  // Always the same response, whether or not an account exists — an
  // identifier-dependent response would let this endpoint be used to test
  // which emails/phones have a Pact account.
  const genericResponse = new ApiResponse(200, "If an account exists for that email, we've sent a reset code.", null);

  const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }], isActive: true });
  if (!user || !user.email || !emailEnabled) {
    res.json(genericResponse);
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetCodeHash: await bcrypt.hash(code, 10),
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MS),
      },
    },
  );

  sendEmail({
    to: user.email,
    subject: 'Your Pact password reset code',
    html: `<p>Someone (hopefully you) asked to reset the password for your Pact account.</p>
      <h2 style="letter-spacing:4px">${code}</h2>
      <p>This code expires in 15 minutes. If you didn't request this, you can safely ignore this email — your password hasn't changed.</p>`,
  }).catch((err) => logger.error('Failed to send password reset email:', err));

  res.json(genericResponse);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, code, newPassword } = req.body as { identifier: string; code: string; newPassword: string };

  const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }], isActive: true })
    .select('+passwordResetCodeHash +passwordResetExpiresAt');

  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    throw ApiError.unauthorized('Invalid or expired reset code');
  }

  const valid = await bcrypt.compare(code, user.passwordResetCodeHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid or expired reset code');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash: newPasswordHash },
      $unset: { passwordResetCodeHash: '', passwordResetExpiresAt: '' },
    },
  );

  // Force re-login everywhere — a password reset is exactly the moment an
  // attacker's existing session (if the account was compromised) should stop working.
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });

  res.json(new ApiResponse(200, 'Password reset — please log in with your new password', null));
});

export const appConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse(200, 'App config', {
    transcriptionEnabled: config.transcription.enabled,
    paymentsEnabled: config.payments.enabled,
    aiEnabled: config.ai.enabled,
    smsInvitesEnabled: config.twilio.enabled,
  }));
});
