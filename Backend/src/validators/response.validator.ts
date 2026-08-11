import { z } from 'zod';

export const respondToEntrySchema = z.object({
  body: z.string().trim().min(1).max(2000),
  reaction: z.string().max(40).optional(),
});

export const setResolutionSchema = z.object({
  status: z.enum(['open', 'talking', 'resolved']),
});
