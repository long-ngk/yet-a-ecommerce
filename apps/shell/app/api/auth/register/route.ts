/**
 * POST /api/auth/register
 *
 * User registration endpoint.
 * - Validates request body with registerSchema (email format, password ≥ 8 chars)
 * - Returns 409 CONFLICT if email is already in use
 * - Hashes password with bcrypt (cost factor 10)
 * - Creates User record in PostgreSQL via Prisma
 * - Returns 201 CREATED with user data (password excluded)
 */

import { type NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { registerSchema } from '../../../../lib/schemas/auth';
import {
  createErrorResponse,
  handleApiError,
} from '../../../../lib/errors';
import { withValidation, createSuccessResponse } from '../../../../lib/middleware';
import { generateRequestId } from '../../../../lib/api-utils';

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = generateRequestId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('BAD_REQUEST', 'Invalid JSON body', 400, undefined, requestId);
  }

  // Validate input with Zod schema
  const validated = withValidation(registerSchema, body, requestId);
  if (validated instanceof Response) return validated;

  const { email, password } = validated;

  try {
    // Check email uniqueness — 409 CONFLICT if already taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return createErrorResponse('CONFLICT', 'Email already in use', 409, undefined, requestId);
    }

    // Hash password with bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Derive a default display name from the email local-part
    const name: string = email.split('@')[0] ?? email;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(user, 201, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
