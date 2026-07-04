/**
 * API client for the Orders MFE.
 *
 * All requests are forwarded to the Shell MFE's API Gateway.
 * The SHELL_API_URL env var defaults to http://localhost:3000 for local development.
 */

const SHELL_API_URL = process.env["SHELL_API_URL"] ?? "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

export interface Order {
  id: string;
  userId: string;
  status: "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  shippingAddress: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface OrdersResponse {
  data: Order[];
  pagination: PaginationMeta;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds fetch options that forward the incoming request cookies so that
 * NextAuth's session cookie is included in server-side API calls.
 */
function buildHeaders(cookieHeader?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }
  return headers;
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's orders (paginated, newest first).
 *
 * @param params  Optional pagination parameters.
 * @param cookieHeader  Raw Cookie header forwarded from the incoming request
 *                      (needed for server-side auth).
 */
export async function getOrders(
  params?: GetOrdersParams,
  cookieHeader?: string,
): Promise<OrdersResponse> {
  const url = new URL(`${SHELL_API_URL}/api/orders`);

  if (params?.page !== undefined) {
    url.searchParams.set("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: buildHeaders(cookieHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ??
        `Failed to fetch orders: ${response.status}`,
    );
  }

  return response.json() as Promise<OrdersResponse>;
}

/**
 * Fetch a single order by ID.
 *
 * @param id  The order ID.
 * @param cookieHeader  Raw Cookie header forwarded from the incoming request.
 */
export async function getOrder(
  id: string,
  cookieHeader?: string,
): Promise<Order> {
  const response = await fetch(`${SHELL_API_URL}/api/orders/${id}`, {
    headers: buildHeaders(cookieHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ??
        `Failed to fetch order ${id}: ${response.status}`,
    );
  }

  return response.json() as Promise<Order>;
}
