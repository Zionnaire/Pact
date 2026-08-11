import { Request, Response } from 'express';
import crypto from 'crypto';
import { Subscription } from '../models/Subscription.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../configs/config';
import { initializeTransaction } from '../configs/paystack';

// Placeholder price — adjust to your real pricing before enabling PAYMENTS_ENABLED.
const BONDED_PRICE_KOBO = 500000; // ₦5,000

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await Subscription.findOne({ pactId: req.pactId });
  res.json(new ApiResponse(200, 'Subscription', subscription));
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
  if (!config.payments.enabled) {
    throw ApiError.notImplemented('Payments are not enabled on this server yet');
  }

  const { email } = req.body;
  const reference = `pact_${req.pactId}_${crypto.randomBytes(6).toString('hex')}`;

  const result = await initializeTransaction({
    email,
    amountKobo: BONDED_PRICE_KOBO,
    reference,
    metadata: { pactId: req.pactId },
  });

  res.json(new ApiResponse(200, 'Checkout initialized', result));
});

export const grantBondedManually = asyncHandler(async (req: Request, res: Response) => {
  const { pactId } = req.params;

  const subscription = await Subscription.findOneAndUpdate(
    { pactId },
    { tier: 'bonded', provider: 'manual', status: 'active', renewsAt: undefined },
    { upsert: true, new: true },
  );

  res.json(new ApiResponse(200, 'Bonded tier granted manually', subscription));
});
