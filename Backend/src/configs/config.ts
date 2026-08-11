/**
 * configs/config.ts
 * Single source of truth for environment configuration.
 * Required-for-boot vars throw immediately; optional/paid-integration vars
 * fall back to safe "feature disabled" defaults so the app runs with zero
 * paid keys configured — see Pact_System_Design.md §6.
 */

import path from 'path';
import dotenv from 'dotenv';

// Loaded explicitly (not `import 'dotenv/config'`) because that resolves
// `.env` relative to process.cwd() — which is Backend/ when running `npm
// run dev` from there, not Backend/src/ where this file (and .env) live.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  appDeepLink: process.env.APP_DEEP_LINK || 'https://pact.app',

  mongoUri: required('MONGODB_URI'),

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    therapistSecret: process.env.JWT_THERAPIST_SECRET || required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    configured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET,
    ),
  },

  twilio: {
    enabled: bool('TWILIO_ENABLED', false),
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  ai: {
    apiKey: process.env.AI_API_KEY || process.env.GROQ_API_KEY || '',
    enabled: Boolean(process.env.AI_API_KEY || process.env.GROQ_API_KEY),
    model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
    baseUrl: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
    toneCheckDailyLimit: Number(process.env.AI_TONE_CHECK_DAILY_LIMIT) || 20,
  },

  transcription: {
    enabled: bool('TRANSCRIPTION_ENABLED', false),
    provider: process.env.TRANSCRIPTION_PROVIDER || 'groq',
    apiKey: process.env.TRANSCRIPTION_API_KEY || process.env.GROQ_API_KEY || '',
    baseUrl: process.env.TRANSCRIPTION_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.TRANSCRIPTION_MODEL || 'whisper-large-v3',
  },

  payments: {
    enabled: bool('PAYMENTS_ENABLED', false),
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    paystackWebhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  },

  push: {
    enabled: Boolean(process.env.EXPO_ACCESS_TOKEN),
    expoAccessToken: process.env.EXPO_ACCESS_TOKEN || '',
  },

  // Protects manual/admin-only routes (e.g. granting the bonded tier for
  // free before Paystack is live). Required only if those routes are used.
  adminSecret: process.env.ADMIN_SECRET || '',
} as const;
