import { Request, Response } from 'express';
import crypto from 'crypto';
import { Subscription } from '../models/Subscription.model';
import { verifyTransaction } from '../configs/paystack';
import { config } from '../configs/config';
import { logger } from '../utils/logger';

/**
 * Mounted with express.raw() ahead of the global JSON parser (see app.ts) —
 * req.body is a Buffer here so the HMAC signature can be verified against
 * the exact bytes Paystack sent, not a re-serialized copy.
 */
export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  const raw = req.body as Buffer;
  const signature = req.headers['x-paystack-signature'];

  const expected = crypto
    .createHmac('sha512', config.payments.paystackWebhookSecret)
    .update(raw)
    .digest('hex');

  if (!config.payments.paystackWebhookSecret || signature !== expected) {
    res.status(401).json({ success: false, message: 'Invalid signature' });
    return;
  }

  const event = JSON.parse(raw.toString('utf8'));

  if (event.event === 'charge.success') {
    const reference = event.data?.reference;
    try {
      const verified = await verifyTransaction(reference);
      if (verified.status === 'success') {
        const pactId = verified.metadata?.pactId;
        if (pactId) {
          await Subscription.findOneAndUpdate(
            { pactId },
            {
              tier: 'bonded',
              provider: 'paystack',
              status: 'active',
              providerCustomerId: verified.customer?.customer_code,
              renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            { upsert: true },
          );
          logger.info(`Subscription activated via Paystack for pact ${pactId}`);
        }
      }
    } catch (err) {
      logger.error('Paystack webhook verification failed:', err);
    }
  }

  res.status(200).json({ received: true });
}

export function smsStatusWebhook(req: Request, res: Response): void {
  logger.info('Twilio SMS status callback:', req.body);
  res.status(200).send('OK');
}
