/**
 * Checkout Summary page — /checkout/summary
 *
 * Server Component:
 *  - calls requireAuth() to redirect unauthenticated users to login.
 *  - Pre-fetches the cart so the first render is populated with real data.
 *  - Delegates all interactivity to SummaryClient (discount, form, place order).
 */
import { requireAuth } from '../../lib/auth-guard';
import { getCart, type CartItem } from '../../lib/api-client';
import { SummaryClient } from '../_components/SummaryClient';

export default async function SummaryPage() {
  // redirect to login when unauthenticated
  await requireAuth('/checkout/summary');

  // Pre-fetch cart on the server for an immediately-populated first render
  let initialItems: CartItem[] = [];

  try {
    const cart = await getCart();
    initialItems = cart.items;
  } catch {
    // Cart fetch may fail when there is no active DB connection in dev;
    // SummaryClient will attempt a client-side fetch + Shared Store fallback.
  }

  return (
    <main>
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '32px 16px 0',
        }}
      >
        <nav
          aria-label="Breadcrumb"
          style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}
        >
          <a href="/checkout" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Cart
          </a>
          {' › '}
          <span>Checkout</span>
        </nav>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            marginBottom: '24px',
          }}
        >
          Checkout
        </h1>
      </div>

      <SummaryClient initialItems={initialItems} />
    </main>
  );
}
