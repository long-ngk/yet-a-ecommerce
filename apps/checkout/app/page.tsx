/**
 * Cart management page — /checkout
 *
 * Server Component:
 *   - calls requireAuth() to redirect unauthenticated users to login.
 *   - Fetches initial cart from the API so the first render is populated.
 *   - Passes data down to CartClient for all interactivity.
 */
import { requireAuth } from '../lib/auth-guard';
import { getCart, type CartItem } from '../lib/api-client';
import { CartClient } from './_components/CartClient';

export default async function CheckoutPage() {
  // redirect to login when unauthenticated
  await requireAuth('/checkout');

  // Pre-fetch cart on the server for a populated first render
  let initialItems: CartItem[] = [];
  let initialTotal = 0;

  try {
    const cart = await getCart();
    initialItems = cart.items;
    initialTotal = cart.total;
  } catch {
    // If the cart fetch fails we still render the page;
    // CartClient will read from Shared Store as a fallback.
  }

  return (
    <main>
      <div
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: '32px 16px 0',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '24px',
          }}
        >
          Shopping Cart
        </h1>
      </div>

      <CartClient initialItems={initialItems} initialTotal={initialTotal} />
    </main>
  );
}
