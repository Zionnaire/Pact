import { z } from 'zod';

export const registerPushTokenSchema = z.object({
  expoPushToken: z.string().min(1),
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().length(24),
});
