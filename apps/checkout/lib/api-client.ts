const SHELL_API_URL =
  process.env["SHELL_API_URL"] ?? "http://localhost:3000";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string | null;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

/**
 * Fetch all cart items for the current authenticated user.
 */
export async function getCart(): Promise<CartResponse> {
  const res = await fetch(`${SHELL_API_URL}/api/cart`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch cart: ${res.status}`);
  }

  return res.json() as Promise<CartResponse>;
}

/**
 * Add a product to the cart. If the product already exists the
 * server accumulates the quantity.
 */
export async function addToCart(
  productId: string,
  quantity: number
): Promise<CartItem> {
  const res = await fetch(`${SHELL_API_URL}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    throw new Error(`Failed to add to cart: ${res.status}`);
  }

  return res.json() as Promise<CartItem>;
}

/**
 * Update the quantity of a cart item. Passing quantity = 0 removes
 * the item from the cart (server behaviour).
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartItem> {
  const res = await fetch(`${SHELL_API_URL}/api/cart/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update cart item: ${res.status}`);
  }

  return res.json() as Promise<CartItem>;
}

/**
 * Remove a cart item by its ID.
 */
export async function removeCartItem(itemId: string): Promise<void> {
  const res = await fetch(`${SHELL_API_URL}/api/cart/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to remove cart item: ${res.status}`);
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

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
  shippingAddress: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

/**
 * Create a new order from the current cart.
 *
 * "Place Order" button calls POST /api/orders.
 * Body must contain shippingAddress and paymentMethod.
 */
export async function createOrder(
  shippingAddress: string,
  paymentMethod: string
): Promise<Order> {
  const res = await fetch(`${SHELL_API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ shippingAddress, paymentMethod }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const message =
      body?.error?.message ?? `Failed to create order: ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<Order>;
}
