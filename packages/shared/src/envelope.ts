// ADR-05: Extended structured response envelope.
// Mọi API response đều follow shape này.

export type ApiResponse<T> =
  | { success: true; data: T; meta?: ResponseMeta }
  | { success: false; error: ApiError; meta?: ResponseMeta };

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  correlationId?: string;
  page?: { offset: number; limit: number; total: number };
}

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'SERVICE_UNAVAILABLE'
  | 'UPSTREAM_ERROR';

export const ok = <T>(data: T, meta?: ResponseMeta): ApiResponse<T> => ({
  success: true,
  data,
  ...(meta ? { meta } : {}),
});

export const err = (
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  meta?: ResponseMeta
): ApiResponse<never> => ({
  success: false,
  error: {
    code,
    message,
    ...(details ? { details } : {}),
  },
  ...(meta ? { meta } : {}),
});
