import { z } from 'zod';
import { deviceFields } from './auth.validator';

export const createPactSchema = z.object({
  name: z.string().trim().min(1).max(60).default('Our Pact'),
  cycleLengthDays: z.number().int().min(1).max(30).default(7),
  revealDay: z.number().int().min(0).max(6).default(0),
  revealTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm 24h format').default('20:00'),
  timezone: z.string().min(1).default('UTC'),
  intentions: z.array(z.string().max(30)).max(12).optional(),
});

export const updatePactSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  cycleLengthDays: z.number().int().min(1).max(30).optional(),
  revealDay: z.number().int().min(0).max(6).optional(),
  revealTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm 24h format').optional(),
  timezone: z.string().min(1).optional(),
  // Names the CURRENT cycle (e.g. "Our June Reset"), not the pact itself.
  cycleName: z.string().trim().max(60).optional(),
});

export const createInviteSchema = z.object({
  channel: z.enum(['sms', 'link', 'email']),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
})
  .refine((data) => data.channel !== 'sms' || Boolean(data.phone), {
    message: 'phone is required for the sms channel',
    path: ['phone'],
  })
  .refine((data) => data.channel !== 'email' || Boolean(data.email), {
    message: 'email is required for the email channel',
    path: ['email'],
  });

export const acceptInviteParamsSchema = z.object({
  code: z.string().min(1),
});

export const inviteIdParamsSchema = z.object({
  id: z.string().length(24),
});

export const quickJoinSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  ...deviceFields,
});
