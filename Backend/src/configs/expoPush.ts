/**
 * configs/expoPush.ts
 * Sends push notifications via Expo's push API — free, no paid account needed.
 */

import axios from 'axios';
import { config } from './config';
import { logger } from '../utils/logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const validMessages = messages.filter((m) => m.to?.startsWith('ExponentPushToken'));
  if (validMessages.length === 0) return;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.push.expoAccessToken) {
      headers.Authorization = `Bearer ${config.push.expoAccessToken}`;
    }
    await axios.post(EXPO_PUSH_URL, validMessages, { headers });
  } catch (err) {
    logger.error('Expo push send failed:', err);
  }
}
