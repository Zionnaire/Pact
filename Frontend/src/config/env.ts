/**
 * config/env.ts
 * EXPO_PUBLIC_-prefixed vars are inlined at build time by Expo — see
 * https://docs.expo.dev/guides/environment-variables/.
 *
 * Android emulator can't reach the host machine via `localhost` — it needs
 * 10.0.2.2. Physical devices need your machine's LAN IP. Set
 * EXPO_PUBLIC_API_URL in Frontend/.env for anything other than iOS
 * simulator / web.
 */
import { Platform } from 'react-native';

function defaultApiUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5001/api/v1`;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl();
