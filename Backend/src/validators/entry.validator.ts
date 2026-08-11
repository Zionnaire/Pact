import { z } from 'zod';

const entryType = z.enum(['rant', 'appreciation', 'request', 'observation']);
const dropMode = z.enum(['standard', 'anonymous', 'urgent']);

// `body` is optional here because a voice entry carries no text body — the
// controller enforces "body OR an uploaded audio file" once it knows
// whether multer attached req.cloudinaryUrl (that fact isn't available to a
// schema that only sees req.body).
export const createEntrySchema = z.object({
  type: entryType,
  body: z.string().trim().min(1).max(4000).optional(),
  mood: z.string().max(40).optional(),
  intensity: z.coerce.number().int().min(1).max(5),
  dropMode: dropMode.default('standard'),
});

export const updateEntrySchema = z.object({
  body: z.string().trim().min(1).max(4000).optional(),
  mood: z.string().max(40).optional(),
  intensity: z.coerce.number().int().min(1).max(5).optional(),
});

export const entryIdParamsSchema = z.object({
  id: z.string().length(24),
});

export const setReactionSchema = z.object({
  reaction: z.enum(['understood', 'surprised', 'need_clarity']),
});
