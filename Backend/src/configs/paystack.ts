/**
 * configs/paystack.ts
 * Thin Paystack REST wrapper (no official Node SDK needed — it's a plain
 * JSON API). No subscription cost to Paystack itself; test-mode keys are
 * free. Disabled by default via PAYMENTS_ENABLED — see Pact_System_Design.md §6.
 */

import axios from 'axios';
import { config } from './config';
import { logger } from '../utils/logger';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

function client() {
  if (!config.payments.enabled || !config.payments.paystackSecretKey) {
    throw new Error('Paystack not configured — set PAYMENTS_ENABLED=true and PAYSTACK_SECRET_KEY');
  }
  return axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: { Authorization: `Bearer ${config.payments.paystackSecretKey}` },
  });
}

export interface InitializeTransactionResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeTransactionResult> {
  const { data } = await client().post('/transaction/initialize', {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    metadata: params.metadata,
  });
  return data.data;
}

export async function verifyTransaction(reference: string) {
  const { data } = await client().get(`/transaction/verify/${reference}`);
  return data.data;
}

if (config.payments.enabled) {
  logger.info('✅ Paystack configured');
} else {
  logger.info('ℹ️  Payments disabled (PAYMENTS_ENABLED=false) — checkout endpoint returns 501, bonded tier can be granted manually');
}
