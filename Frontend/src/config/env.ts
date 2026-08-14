/**
 * config/env.ts
 * Reads the API URL from Constants.expoConfig.extra.apiUrl — set in
 * app.config.ts from EXPO_PUBLIC_API_URL at config-evaluation time (build
 * or `eas update` bundling). Going through `extra` rather than referencing
 * process.env.EXPO_PUBLIC_API_URL directly means the *running app* can
 * report what URL actually got baked in (see the "API endpoint" row in
 * Pact tab → Settings) — with a bare inlined process.env reference there's
 * no way to check that without device logs, which is what made a wrong
 * value here so slow to diagnose.
 *
 * Android emulator can't reach the host machine via `localhost` — it needs
 * 10.0.2.2. Physical devices need your machine's LAN IP or a real hosted
 * backend. Set EXPO_PUBLIC_API_URL in Frontend/.env before building or
 * running `eas update` — see app.config.ts for why that file specifically
 * (not eas.json) is what controls this for OTA updates.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function defaultApiUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:5001/api/v1`;
}

export const API_BASE_URL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) || defaultApiUrl();

/** Same backend, public (unauthenticated) routes — legal pages live here, not behind /api/v1. */
export const PUBLIC_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '/api/public');
