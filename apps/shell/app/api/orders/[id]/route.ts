/**
 * GET /api/orders/[id]  — Fetch a single order with its items for the authenticated user
 *
 * - Requires auth (401 if not)
 * - Returns 404 if the order does not exist or belongs to a different user
 * - Response includes: id, status, totalAmount, shippingAddress, paymentMethod,
 *   shippingFee, discountAmount, createdAt and items (with product info)
 */

import { type NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { createErrorResponse, handleApiError } from '../../../../lib/errors';
import { withAuth, createSuccessResponse } from '../../../../lib/middleware';
import { generateRequestId } from '../../../../lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const requestId = generateRequestId();

  // Auth guard
  const sessionOrResponse = await withAuth(request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;
  const session = sessionOrResponse;
  const userId = session.user?.id as string;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // 404 if not found or not owned by this user
    if (!order || order.userId !== userId) {
      return createErrorResponse('NOT_FOUND', 'Order not found', 404, undefined, requestId);
    }

    // Shape the response to include all required fields
    const response = {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      shippingFee: order.shippingFee,
      discountAmount: order.discountAmount,
      createdAt: order.createdAt,
      items: order.items,
    };

    return createSuccessResponse(response, 200, requestId);
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
