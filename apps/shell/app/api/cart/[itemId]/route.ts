/**
 * PATCH  /api/cart/[itemId] – Update quantity (delete if quantity = 0)
 * DELETE /api/cart/[itemId] – Remove a cart item
 */

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { updateCartItemSchema } from '../../../../lib/schemas/cart';
import {
  createErrorResponse,
  handleApiError,
} from '../../../../lib/errors';
import {
  withAuth,
  withValidation,
  createSuccessResponse,
} from '../../../../lib/middleware';
import { generateRequestId } from '../../../../lib/api-utils';

// ─── Helper: find CartItem and verify ownership ───────────────────────────────

async function findOwnedCartItem(itemId: string, userId: string) {
  return prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cart: { userId },
    },
    include: {
      product: {
        select: { name: true, price: true, images: true },
      },
    },
  });
}

// ─── PATCH /api/cart/[itemId] ─────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<Response> {
  const requestId = generateRequestId();

  // Auth check
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = (session.user as { id: string }).id;

  // Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse('BAD_REQUEST', 'Invalid JSON body', 400, undefined, requestId);
  }

  const validated = withValidation(updateCartItemSchema, body, requestId);
  if (validated instanceof NextResponse) return validated;

  const { quantity } = validated;
  const { itemId } = await params;

  try {
    const cartItem = await findOwnedCartItem(itemId, userId);
    if (!cartItem) {
      return createErrorResponse('NOT_FOUND', 'Cart item not found', 404, undefined, requestId);
    }

    // If quantity = 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return createSuccessResponse({ message: 'Cart item removed' }, 200, requestId);
    }

    // Otherwise update the quantity
    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          select: { name: true, price: true, images: true },
        },
      },
    });

    const responseItem = {
      id: updated.id,
      productId: updated.productId,
      name: updated.product.name,
      price: updated.product.price,
      quantity: updated.quantity,
      subtotal: updated.product.price * updated.quantity,
      image: updated.product.images[0] ?? null,
    };

    return createSuccessResponse(responseItem, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// ─── DELETE /api/cart/[itemId] ────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<Response> {
  const requestId = generateRequestId();

  // Auth check
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = (session.user as { id: string }).id;

  const { itemId } = await params;

  try {
    const cartItem = await findOwnedCartItem(itemId, userId);
    if (!cartItem) {
      return createErrorResponse('NOT_FOUND', 'Cart item not found', 404, undefined, requestId);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return createSuccessResponse({ message: 'Cart item removed' }, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
