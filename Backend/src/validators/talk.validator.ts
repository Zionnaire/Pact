import { z } from 'zod';

export const scheduleTalkSchema = z.object({
  scheduledFor: z.coerce.date(),
  agendaEntryIds: z.array(z.string().length(24)).max(20).default([]),
});
