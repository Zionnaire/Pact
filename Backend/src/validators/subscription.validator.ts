import { z } from 'zod';

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
