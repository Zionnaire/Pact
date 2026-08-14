/**
 * configs/email.ts
 * Transactional email via Microsoft Graph app-only auth (client-credentials
 * grant — no user sign-in involved). Requires an Azure AD app registration
 * with admin-consented Mail.Send application permission; the app sends as
 * a single mailbox (MS_SENDER_EMAIL), not per-user.
 * No-op (throws only when actually invoked) if not configured, matching
 * every other optional integration in this codebase — see
 * Pact_System_Design.md §6.
 */

import axios from 'axios';
import { config } from './config';
import { logger } from '../utils/logger';

const TOKEN_URL = (tenantId: string) => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const SEND_MAIL_URL = (senderEmail: string) => `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;

let cachedToken: { value: string; expiresAt: number } | null = null;

if (config.email.enabled) {
  logger.info(`✅ Email configured (Microsoft Graph, sending as ${config.email.senderEmail})`);
} else {
  logger.info('ℹ️  Email not configured — password reset and email invites are disabled');
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    client_id: config.email.clientId,
    client_secret: config.email.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const { data } = await axios.post<{ access_token: string; expires_in: number }>(
    TOKEN_URL(config.email.tenantId),
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!config.email.enabled) {
    throw new Error('Email not configured — set MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_SENDER_EMAIL');
  }

  const token = await getAccessToken();

  await axios.post(
    SEND_MAIL_URL(config.email.senderEmail),
    {
      message: {
        subject: params.subject,
        body: { contentType: 'HTML', content: params.html },
        toRecipients: [{ emailAddress: { address: params.to } }],
      },
      saveToSentItems: false,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
  );
}

export const emailEnabled = config.email.enabled;
