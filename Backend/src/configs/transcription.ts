/**
 * configs/transcription.ts
 * Voice-note transcription via the OpenAI SDK pointed at an
 * OpenAI-compatible endpoint. Defaults to Groq (whisper-large-v3, free
 * tier) instead of OpenAI directly — same code path, swap TRANSCRIPTION_*
 * env vars to point at real OpenAI later. Disabled by default.
 * See Pact_System_Design.md §6.
 */

import OpenAI from 'openai';
import { config } from './config';
import { logger } from '../utils/logger';

let client: OpenAI | null = null;

if (config.transcription.enabled) {
  if (!config.transcription.apiKey) {
    logger.warn('⚠️  TRANSCRIPTION_ENABLED=true but no TRANSCRIPTION_API_KEY/GROQ_API_KEY set — disabling');
  } else {
    client = new OpenAI({
      apiKey: config.transcription.apiKey,
      baseURL: config.transcription.baseUrl,
    });
    logger.info(`✅ Transcription configured (${config.transcription.provider}: ${config.transcription.model})`);
  }
} else {
  logger.info('ℹ️  Transcription disabled — voice entries will remain playable without a transcript');
}

export function getTranscriptionClient(): OpenAI {
  if (!client) {
    throw new Error('Transcription client not configured');
  }
  return client;
}

export const transcriptionEnabled = Boolean(client);
export const transcriptionModel = config.transcription.model;
