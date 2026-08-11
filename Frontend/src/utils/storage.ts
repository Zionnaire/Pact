/**
 * utils/storage.ts
 * Secure, persisted storage for auth tokens and the device identity.
 * expo-secure-store uses Keychain on iOS / Keystore-backed EncryptedSharedPreferences
 * on Android; on web it falls back to localStorage (fine for dev, not a real
 * secret store — don't ship the web target for anything sensitive as-is).
 */

import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'pact.accessToken';
const REFRESH_TOKEN_KEY = 'pact.refreshToken';
const DEVICE_ID_KEY = 'pact.deviceId';

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};

export const deviceIdStorage = {
  async get(): Promise<string | null> {
    return SecureStore.getItemAsync(DEVICE_ID_KEY);
  },
  async set(id: string): Promise<void> {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  },
};
