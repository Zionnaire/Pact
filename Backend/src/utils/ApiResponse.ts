/**
 * utils/ApiResponse.ts
 * Standardised response shape for every endpoint.
 * Shape: { success, statusCode, message, data, meta? }
 */

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    data: T,
    meta?: Record<string, unknown>,
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}
