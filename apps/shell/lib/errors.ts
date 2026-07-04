/**
 * Standardized error response builder for Shell MFE API Gateway.
 * All API error responses follow the structure:
 * { error: { code: string, message: string, details?: { field, message }[] } }
 */

import { NextResponse } from 'next/server';
import { generateRequestId } from './api-utils';

// ─── Error Codes ────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

// ─── HTTP Status Map ─────────────────────────────────────────────────────────

export const HTTP_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ─── Error Response Types ────────────────────────────────────────────────────

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: FieldError[];
  };
}

// ─── Response Builder ────────────────────────────────────────────────────────

/**
 * Creates a standardized JSON error response with X-Request-Id header.
 *
 * @param code     - Machine-readable error code
 * @param message  - Human-readable error message
 * @param status   - HTTP status code (defaults to the canonical status for the code)
 * @param details  - Optional array of field-level validation errors
 * @param requestId - Optional request ID (generated if not provided)
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status?: number,
  details?: FieldError[],
  requestId?: string,
): NextResponse<ApiErrorResponse> {
  const resolvedStatus = status ?? HTTP_STATUS[code];
  const resolvedRequestId = requestId ?? generateRequestId();

  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status: resolvedStatus,
    headers: {
      'X-Request-Id': resolvedRequestId,
    },
  });
}

// ─── Global Error Handler ────────────────────────────────────────────────────

/**
 * Handles unexpected errors in API route handlers.
 * Logs the full error internally but returns a generic 500 to the client
 * to avoid leaking internal implementation details.
 *
 * @param error     - The caught error (any type)
 * @param requestId - Request ID for log correlation
 */
export function handleApiError(
  error: unknown,
  requestId: string,
): NextResponse<ApiErrorResponse> {
  // Log full error details server-side for debugging/tracing
  console.error(`[${requestId}] Internal Server Error:`, error);

  return createErrorResponse(
    'INTERNAL_ERROR',
    'Internal Server Error',
    500,
    undefined,
    requestId,
  );
}

// ─── Zod Error Formatter ─────────────────────────────────────────────────────

/**
 * Converts a Zod ZodError into the standardized FieldError array format.
 * Each issue is mapped to { field: dotted.path, message }.
 */
export function formatZodErrors(
  zodError: { issues: Array<{ path: (string | number)[]; message: string }> },
): FieldError[] {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
}
