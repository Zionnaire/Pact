/**
 * utils/device.ts
 * Stable per-install device identity — backs the Session model on the
 * backend (one row per device, used for refresh rotation + push tokens).
 */

import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { deviceIdStorage } from './storage';
import type { DeviceInfo } from '../types';

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await deviceIdStorage.get();
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await deviceIdStorage.set(id);
  return id;
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getOrCreateDeviceId();
  const platform: DeviceInfo['platform'] = Platform.OS === 'ios' || Platform.OS === 'android'
    ? Platform.OS
    : 'web';

  return {
    deviceId,
    platform,
    appVersion: Application.nativeApplicationVersion ?? undefined,
  };
}
