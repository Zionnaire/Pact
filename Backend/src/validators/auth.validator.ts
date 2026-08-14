import { z } from 'zod';

const deviceFields = {
  deviceId: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().optional(),
  expoPushToken: z.string().optional(),
};

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(1).max(60),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(8).max(128),
    ...deviceFields,
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
    path: ['email'],
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
  ...deviceFields,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1),
});

export const logoutSchema = z.object({
  deviceId: z.string().min(1).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(160).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});
