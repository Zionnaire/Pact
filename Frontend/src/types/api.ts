/**
 * types/api.ts
 * Shape of every backend response — mirrors Backend/src/utils/ApiResponse.ts.
 */

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  message: string;
  errors: unknown[];
}

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: unknown[] = [],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion?: string;
  expoPushToken?: string;
}
