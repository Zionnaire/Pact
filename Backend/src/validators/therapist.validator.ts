import { z } from 'zod';

export const grantTherapistAccessSchema = z.object({
  therapistEmail: z.string().trim().toLowerCase().email(),
  scopes: z.array(z.enum(['summary', 'themes', 'pulse_history'])).min(1).default(['summary']),
  expiresInDays: z.number().int().min(1).max(365).default(90),
});

export const grantIdParamsSchema = z.object({
  id: z.string().length(24),
});
