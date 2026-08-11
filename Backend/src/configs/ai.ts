/**
 * configs/ai.ts
 * Groq-hosted LLM client for toneCheck and theme extraction, via the OpenAI
 * SDK pointed at Groq's OpenAI-compatible endpoint (same pattern as
 * configs/transcription.ts, and reuses the same GROQ_API_KEY — one free-tier
 * key covers both Whisper transcription and chat completions).
 */

import OpenAI from 'openai';
import { config } from './config';
import { logger } from '../utils/logger';

let client: OpenAI | null = null;

if (config.ai.enabled) {
  client = new OpenAI({ apiKey: config.ai.apiKey, baseURL: config.ai.baseUrl });
  logger.info(`✅ Groq AI configured (${config.ai.model})`);
} else {
  logger.warn('⚠️  GROQ_API_KEY not set — AI endpoints will return 501');
}

export function getAiClient(): OpenAI {
  if (!client) {
    throw new Error('AI client not configured — set GROQ_API_KEY');
  }
  return client;
}

export const aiEnabled = config.ai.enabled;
