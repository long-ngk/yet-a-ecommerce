/**
 * GET /api/products/[id]
 * Return a single product by ID, or 404 if not found.
 */

import type { NextRequest } from 'next/server';
import { createSuccessResponse } from '../../../../lib/middleware';
import { createErrorResponse, handleApiError } from '../../../../lib/errors';
import prisma from '../../../../lib/prisma';
import { generateRequestId } from '../../../../lib/api-utils';

// ─── GET /api/products/[id] ───────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = generateRequestId();

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return createErrorResponse('NOT_FOUND', 'Product not found', 404, undefined, requestId);
    }

    return createSuccessResponse(product, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
