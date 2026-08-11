/**
 * services/api.ts
 * Single axios instance for every service. Attaches the access token to
 * every request; on a 401 it transparently refreshes (de-duplicated across
 * concurrent requests) and retries once. If the refresh itself fails, it
 * clears stored tokens and calls whatever AuthContext registered via
 * onAuthFailure — this file has no notion of navigation/context itself.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import { tokenStorage } from '../utils/storage';
import { getOrCreateDeviceId } from '../utils/device';
import { ApiRequestError, ApiResponse } from '../types';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let onAuthFailure: (() => void) | null = null;
export function registerAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const deviceId = await getOrCreateDeviceId();

  try {
    const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken, deviceId },
    );
    await tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: unknown[] }>) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && config && !config._retried && !config.url?.includes('/auth/')) {
      config._retried = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;

      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(config);
      }

      await tokenStorage.clear();
      onAuthFailure?.();
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong';
    throw new ApiRequestError(error.response?.status ?? 0, message, error.response?.data?.errors ?? []);
  },
);
