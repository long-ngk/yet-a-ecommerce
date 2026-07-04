/**
 * Shared middleware functions for Shell MFE API Route Handlers.
 *
 * - withAuth: validates session via NextAuth v5, returns 401 if unauthenticated
 * - withValidation: validates data against a Zod schema, returns 400 on failure
 */

import type { NextRequest } from 'next/server';
import type { ZodSchema } from 'zod';
import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { createErrorResponse, formatZodErrors } from './errors';
import { generateRequestId } from './api-utils';

// ─── Auth Middleware ─────────────────────────────────────────────────────────

/**
 * Validates the current session using NextAuth v5.
 *
 * Import the `auth` function from `lib/auth.ts` (configured in task 3.5).
 * Returns the Session object when authenticated, or a 401 NextResponse when not.
 *
 * Usage in a Route Handler:
 * ```ts
 * const sessionOrResponse = await withAuth(request);
 * if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
 * const session = sessionOrResponse; // typed as Session
 * ```
 */
export async function withAuth(
  _request: NextRequest,
): Promise<Session | NextResponse> {
  // auth is configured in lib/auth.ts (task 3.5) and exports NextAuth v5's auth() function.
  const { auth } = await import('./auth');

  const session = await auth();

  if (!session || !session.user) {
    const requestId = generateRequestId();
    return createErrorResponse('UNAUTHORIZED', 'Unauthorized', 401, undefined, requestId);
  }

  return session;
}

// ─── Validation Middleware ────────────────────────────────────────────────────

/**
 * Validates arbitrary data against a Zod schema.
 * Returns the parsed (type-safe) data on success, or a 400 NextResponse on failure.
 *
 * Usage in a Route Handler:
 * ```ts
 * const bodyOrResponse = withValidation(MySchema, await request.json());
 * if (bodyOrResponse instanceof NextResponse) return bodyOrResponse;
 * const body = bodyOrResponse; // typed as MySchemaType
 * ```
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  data: unknown,
  requestId?: string,
): T | NextResponse {
  const result = schema.safeParse(data);

  if (!result.success) {
    const resolvedRequestId = requestId ?? generateRequestId();
    const details = formatZodErrors(result.error);
    return createErrorResponse(
      'VALIDATION_ERROR',
      'Validation failed',
      400,
      details,
      resolvedRequestId,
    );
  }

  return result.data;
}

// ─── Response with X-Request-Id ──────────────────────────────────────────────

/**
 * Wraps a successful JSON response to ensure the X-Request-Id header is always present.
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string,
): NextResponse<T> {
  const resolvedRequestId = requestId ?? generateRequestId();
  return NextResponse.json(data, {
    status,
    headers: {
      'X-Request-Id': resolvedRequestId,
    },
  });
}
