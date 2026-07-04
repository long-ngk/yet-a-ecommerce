/**
 * GET /api/products
 * List products with pagination, search, category filter, and sort.
 *
 * Query parameters (validated via Zod productsQuerySchema):
 *   - page     (default 1)
 *   - limit    (default 20)
 *   - search   – case-insensitive match on name or description
 *   - category – exact match on category field
 *   - sort     – price_asc | price_desc | name_asc | newest (default: newest)
 *
 * Response: { data: Product[], pagination: { total, totalPages, currentPage, limit } }
 */

import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { createSuccessResponse, withValidation } from '../../../lib/middleware';
import { handleApiError } from '../../../lib/errors';
import { productsQuerySchema } from '../../../lib/schemas/products';
import prisma from '../../../lib/prisma';
import { generateRequestId } from '../../../lib/api-utils';

// ─── Sort order map ───────────────────────────────────────────────────────────

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name_asc: { name: 'asc' },
  newest: { createdAt: 'desc' },
};

// ─── GET /api/products ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Parse query params from the URL
    const searchParams = request.nextUrl.searchParams;
    const rawParams = Object.fromEntries(searchParams);

    // Validate with Zod
    const parsedOrResponse = withValidation(productsQuerySchema, rawParams, requestId);
    if (parsedOrResponse instanceof Response) return parsedOrResponse;

    const { page: rawPage, limit: rawLimit, search, category, sort } = parsedOrResponse;
    const page = rawPage ?? 1;
    const limit = rawLimit ?? 20;

    // Build Prisma where clause
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Determine sort order
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort && SORT_MAP[sort] ? SORT_MAP[sort] : { createdAt: 'desc' };

    // Pagination
    const skip = (page - 1) * limit;

    // Run count and data queries in parallel
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse(
      {
        data: products,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
