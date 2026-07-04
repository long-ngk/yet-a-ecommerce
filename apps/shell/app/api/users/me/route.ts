/**
 * GET  /api/users/me  – Return current user's profile
 * PATCH /api/users/me – Update allowed profile fields only (name, phone, address, avatar)
 *
 * Both endpoints require an authenticated session (401 if not).
 * PATCH validates the body with updateProfileSchema and returns field-specific
 * 400 errors for invalid data.  email, role, and id are always ignored even if
 * present in the request body (Zod strips them; we also destructure explicitly).
 */

import { type NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma';
import { updateProfileSchema } from '../../../../lib/schemas/users';
import { handleApiError, createErrorResponse } from '../../../../lib/errors';
import { withAuth, withValidation, createSuccessResponse } from '../../../../lib/middleware';
import { generateRequestId } from '../../../../lib/api-utils';

// ─── GET /api/users/me ───────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = generateRequestId();

  // Auth guard – returns 401 NextResponse if unauthenticated
  const session = await withAuth(request);
  if (session instanceof Response) return session;

  // session.user is guaranteed by withAuth, but TypeScript needs explicit narrowing
  if (!session.user?.id) {
    return createErrorResponse('UNAUTHORIZED', 'Unauthorized', 401, undefined, requestId);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        // Explicitly exclude password and role
      },
    });

    if (!user) {
      return createErrorResponse('NOT_FOUND', 'User not found', 404, undefined, requestId);
    }

    return createSuccessResponse(user, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// ─── PATCH /api/users/me ─────────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<Response> {
  const requestId = generateRequestId();

  // Auth guard – returns 401 NextResponse if unauthenticated
  const session = await withAuth(request);
  if (session instanceof Response) return session;

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('BAD_REQUEST', 'Invalid JSON body', 400, undefined, requestId);
  }

  // Validate with Zod — strips unknown fields (email, role, id) by default
  const validated = withValidation(updateProfileSchema, body, requestId);
  if (validated instanceof Response) return validated;

  // Explicitly destructure only the 4 allowed fields as an extra safety layer
  const { name, phone, address, avatar } = validated;

  // session.user is guaranteed by withAuth, but TypeScript needs explicit narrowing
  if (!session.user?.id) {
    return createErrorResponse('UNAUTHORIZED', 'Unauthorized', 401, undefined, requestId);
  }

  // Build update data — only include fields that were provided in the request
  const updateData: {
    name?: string;
    phone?: string | null;
    address?: string | null;
    avatar?: string | null;
  } = {};

  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (avatar !== undefined) updateData.avatar = avatar;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        // Explicitly exclude password and role
      },
    });

    return createSuccessResponse(updatedUser, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
