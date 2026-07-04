/**
 * GET  /api/cart  – Return current user's cart (items + total)
 * POST /api/cart  – Add a product to the cart (accumulate if already present)
 */

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { addToCartSchema } from '../../../lib/schemas/cart';
import {
  createErrorResponse,
  handleApiError,
} from '../../../lib/errors';
import {
  withAuth,
  withValidation,
  createSuccessResponse,
} from '../../../lib/middleware';
import { generateRequestId } from '../../../lib/api-utils';

// ─── GET /api/cart ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = generateRequestId();

  // Auth check
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = (session.user as { id: string }).id;

  try {
    // Get or create the user's cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    // Shape response items
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      image: item.product.images[0] ?? null,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return createSuccessResponse({ items, total }, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// ─── POST /api/cart ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<Response> {
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

  const validated = withValidation(addToCartSchema, body, requestId);
  if (validated instanceof NextResponse) return validated;

  const { productId, quantity } = validated;

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return createErrorResponse('NOT_FOUND', 'Product not found', 404, undefined, requestId);
    }

    // Get or create cart for user
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Check if product is already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    let cartItem;
    let isNew: boolean;

    if (existingItem) {
      // Accumulate quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            select: { name: true, price: true, images: true },
          },
        },
      });
      isNew = false;
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
        include: {
          product: {
            select: { name: true, price: true, images: true },
          },
        },
      });
      isNew = true;
    }

    const responseItem = {
      id: cartItem.id,
      productId: cartItem.productId,
      name: cartItem.product.name,
      price: cartItem.product.price,
      quantity: cartItem.quantity,
      subtotal: cartItem.product.price * cartItem.quantity,
      image: cartItem.product.images[0] ?? null,
    };

    return createSuccessResponse(responseItem, isNew ? 201 : 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
