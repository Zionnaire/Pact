/**
 * services/api.ts
 * Single axios instance for every service. Attaches the access token to
 * every request; on a 401 it transparently refreshes (de-duplicated across
 * concurrent requests) and retries once. If the refresh itself fails, it
 * clears stored tokens and calls whatever AuthContext registered via
 * onAuthFailure — this file has no notion of navigation/context itself.
 *
 * Errors are classified before they ever reach a screen (see
 * classifyError): a bare "Network Error" is never something a user should
 * see, since it doesn't tell them whether to wait, retry, or check their
 * connection. Infra-class failures (no response at all, or a 5xx) also
 * fire a global toast — see contexts/ToastContext.tsx — since those can
 * happen during any action on any screen, not just the one a given
 * catch-block was written for.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/env';
import { tokenStorage } from '../utils/storage';
import { getOrCreateDeviceId } from '../utils/device';
import { showGlobalToast } from '../contexts/ToastContext';
import { ApiRequestError, ApiResponse } from '../types';

// The free tier of most low-cost hosts (this app's backend included) sleeps
// after ~15min idle and can take 30-50s to wake on the next request — long
// enough that the old 20s timeout misreported a slow-but-healthy backend as
// a hard failure.
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

interface BackendErrorBody {
  message?: string;
  errors?: Array<{ message?: string; path?: (string | number)[] }>;
}

interface ClassifiedError {
  message: string;
  /** No response reached us at all, or the server itself errored (5xx) — not the user's fault, worth a toast wherever it happens. */
  isInfraError: boolean;
}

function classifyError(error: AxiosError<BackendErrorBody>): ClassifiedError {
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message)) {
      return { message: "That's taking longer than expected — the server may be waking up. Please try again in a moment.", isInfraError: true };
    }
    return { message: "Can't reach Pact right now — check your internet connection and try again.", isInfraError: true };
  }

  const status = error.response.status;
  const body = error.response.data;

  if (status >= 500) {
    return { message: 'Something went wrong on our end. Please try again in a moment.', isInfraError: true };
  }
  if (status === 429) {
    return { message: "You're doing that a bit too fast — try again shortly.", isInfraError: false };
  }

  // Zod validation errors: { message: 'Validation failed', errors: [{message, path}, ...] }
  // — surface the specific field problem instead of the generic wrapper message.
  const firstIssue = body?.errors?.find((e) => e?.message)?.message;
  if (firstIssue) {
    return { message: firstIssue, isInfraError: false };
  }

  return { message: body?.message || 'Something went wrong — please try again', isInfraError: false };
}

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
  async (error: AxiosError<BackendErrorBody>) => {
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

    const { message, isInfraError } = classifyError(error);
    if (isInfraError) {
      showGlobalToast('error', message);
    }

    throw new ApiRequestError(error.response?.status ?? 0, message, error.response?.data?.errors ?? []);
  },
);
