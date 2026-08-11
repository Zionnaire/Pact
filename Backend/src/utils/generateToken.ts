/**
 * utils/generateToken.ts
 * JWT access and refresh token generation + verification.
 * Access token  → 15 minutes
 * Refresh token → 30 days, one per Session (device)
 */

import jwt from 'jsonwebtoken';
import { config } from '../configs/config';

export interface TokenPayload {
  userId: string;
  pactId?: string;
  sessionId?: string;
}

export interface TherapistTokenPayload {
  scope: 'therapist';
  pactId: string;
  grantId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

export function generateTherapistToken(payload: TherapistTokenPayload, expiresIn: string): string {
  return jwt.sign(payload, config.jwt.therapistSecret, { expiresIn } as jwt.SignOptions);
}

export function verifyTherapistToken(token: string): TherapistTokenPayload {
  return jwt.verify(token, config.jwt.therapistSecret) as TherapistTokenPayload;
}
