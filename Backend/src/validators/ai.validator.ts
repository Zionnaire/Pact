import { z } from 'zod';

export const toneCheckSchema = z.object({
  draft: z.string().trim().min(1).max(4000),
  type: z.enum(['rant', 'appreciation', 'request', 'observation']).optional(),
});
