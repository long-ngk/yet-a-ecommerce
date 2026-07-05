/**
 * GET  /api/orders  — List authenticated user's orders (sorted newest first, paginated)
 * POST /api/orders  — Create a new order from the current cart
 *
 * GET behavior:
 *  - Requires auth (401 if not)
 *  - Accepts optional `page` (default 1) and `limit` (default 20) query params
 *  - Returns { data: Order[], pagination: { total, totalPages, currentPage } }
 *
 * POST behavior:
 *  - Requires auth (401 if not)
 *  - Body: { shippingAddress: string, paymentMethod: string }
 *  - Returns 400 BAD_REQUEST if cart is empty
 *  - Creates Order + OrderItems + deletes CartItems atomically in a transaction
 *  - Returns 201 CREATED with the created order
 */

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { createOrderSchema } from '../../../lib/schemas/orders';
import { createErrorResponse, handleApiError } from '../../../lib/errors';
import { withAuth, withValidation, createSuccessResponse } from '../../../lib/middleware';
import { generateRequestId } from '../../../lib/api-utils';

// ─── GET /api/orders ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  // Auth guard
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = session.user?.id as string;

  // Pagination params
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20);
  const skip = (page - 1) * limit;

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse(
      {
        data: orders,
        pagination: {
          total,
          totalPages,
          currentPage: page,
        },
      },
      200,
      requestId,
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();

  // Auth guard
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = session.user?.id as string;

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('BAD_REQUEST', 'Invalid JSON body', 400, undefined, requestId);
  }

  const validated = withValidation(createOrderSchema, body, requestId);
  if (validated instanceof NextResponse) return validated;

  const { shippingAddress, paymentMethod } = validated;

  try {
    // Fetch user's cart with all items including product prices
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, price: true },
            },
          },
        },
      },
    });

    // 400 if cart is empty or doesn't exist
    if (!cart || cart.items.length === 0) {
      return createErrorResponse('BAD_REQUEST', 'Cart is empty', 400, undefined, requestId);
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    // Create order + order items + clear cart items + update stock atomically
    const order = await prisma.$transaction(async (tx) => {
      // Update product stock for each cart item
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          shippingAddress,
          paymentMethod,
          totalAmount,
          status: 'PENDING',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true },
              },
            },
          },
        },
      });

      // Clear all cart items for this cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return createSuccessResponse(order, 201, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
