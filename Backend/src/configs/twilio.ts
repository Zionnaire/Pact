/**
 * configs/twilio.ts
 * Optional SMS invites. The free default is the `link` invite channel
 * (Invite.channel = 'link') — Twilio is only needed if the user opts into
 * texting a code instead of sharing a link.
 */

import twilio from 'twilio';
import { config } from './config';
import { logger } from '../utils/logger';

let client: ReturnType<typeof twilio> | null = null;

if (config.twilio.enabled && config.twilio.accountSid && config.twilio.authToken) {
  client = twilio(config.twilio.accountSid, config.twilio.authToken);
  logger.info('✅ Twilio configured');
} else {
  logger.info('ℹ️  Twilio not configured — SMS invite channel disabled, link invites still work');
}

export async function sendInviteSms(toPhone: string, body: string): Promise<void> {
  if (!client) {
    throw new Error('Twilio not configured — set TWILIO_ENABLED=true with valid credentials');
  }
  await client.messages.create({
    to: toPhone,
    from: config.twilio.phoneNumber,
    body,
  });
}

export const twilioEnabled = Boolean(client);
