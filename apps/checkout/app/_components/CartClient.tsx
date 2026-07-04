'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@yet-a-ecommerce/ui';
import {
  dispatch,
  subscribe,
  writeStore,
  readStore,
  type EventPayload,
} from '@yet-a-ecommerce/communication';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  type CartItem,
} from '../../lib/api-client';

interface CartAddPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartClientProps {
  /** Initial cart items pre-fetched on the server. */
  initialItems: CartItem[];
  /** Initial cart total pre-fetched on the server. */
  initialTotal: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function calcTotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
}

function calcTotalCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// ─── component ───────────────────────────────────────────────────────────────

export function CartClient({ initialItems, initialTotal }: CartClientProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Sync to Shared Store + dispatch cart:update whenever items change ──────
  const syncCart = useCallback((updatedItems: CartItem[]) => {
    const computedTotal = calcTotal(updatedItems);
    const totalCount = calcTotalCount(updatedItems);

    setItems(updatedItems);
    setTotal(computedTotal);

    // persist to Shared Store for cross-zone persistence
    writeStore('checkout', 'cart', updatedItems);

    // dispatch cart:update so Shell header badge updates
    dispatch('cart:update', {
      type: 'cart:update',
      data: { items: updatedItems, totalCount },
      timestamp: Date.now(),
      source: 'checkout',
    });
  }, []);

  // ── On mount: attempt catch-up from Shared Store, then subscribe cart:add ─
  useEffect(() => {
    // read latest cart from Shared Store on mount (catch-up)
    const stored = readStore<CartItem[]>('checkout', 'cart');
    if (stored && stored.length > 0) {
      setItems(stored);
      setTotal(calcTotal(stored));
    }

    // subscribe to cart:add events dispatched by Products MFE
    const unsubscribe = subscribe('cart:add', async (event: EventPayload) => {
      const payload = event.data as CartAddPayload;
      if (!payload?.productId) return;

      try {
        await addToCart(payload.productId, payload.quantity ?? 1);
        // Re-fetch authoritative cart from server after adding
        const updated = await getCart();
        syncCart(updated.items);
      } catch (err) {
        console.error('[CartClient] Failed to handle cart:add event:', err);
        setError('Failed to add item to cart. Please try again.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncCart]);

  // ── Quantity change ────────────────────────────────────────────────────────
  const handleQuantityChange = useCallback(
    async (item: CartItem, delta: number) => {
      const newQuantity = item.quantity + delta;
      setLoadingItemId(item.id);
      setError(null);

      try {
        if (newQuantity <= 0) {
          // Remove the item entirely when quantity would reach 0
          await removeCartItem(item.id);
          syncCart(items.filter((i) => i.id !== item.id));
        } else {
          await updateCartItem(item.id, newQuantity);
          syncCart(
            items.map((i) =>
              i.id === item.id ? { ...i, quantity: newQuantity } : i,
            ),
          );
        }
      } catch (err) {
        console.error('[CartClient] Failed to update cart item quantity:', err);
        setError('Failed to update quantity. Please try again.');
      } finally {
        setLoadingItemId(null);
      }
    },
    [items, syncCart],
  );

  // ── Remove item ────────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (item: CartItem) => {
      setLoadingItemId(item.id);
      setError(null);

      try {
        await removeCartItem(item.id);
        syncCart(items.filter((i) => i.id !== item.id));
      } catch (err) {
        console.error('[CartClient] Failed to remove cart item:', err);
        setError('Failed to remove item. Please try again.');
      } finally {
        setLoadingItemId(null);
      }
    },
    [items, syncCart],
  );

  // ── Empty cart state ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>Your cart is empty.</p>
        <a href="/products" style={styles.shopLink}>
          Continue shopping
        </a>
      </div>
    );
  }

  // ── Cart item list ─────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {error && (
        <div style={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div style={styles.itemList}>
        {items.map((item) => {
          const subtotal = item.price * item.quantity;
          const isLoading = loadingItemId === item.id;

          return (
            <div key={item.id} style={styles.itemRow} aria-busy={isLoading}>
              {/* Product image */}
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  style={styles.itemImage}
                />
              ) : (
                <div style={styles.imagePlaceholder} aria-hidden="true" />
              )}

              {/* Product info */}
              <div style={styles.itemInfo}>
                <p style={styles.itemName}>{item.name}</p>
                <p style={styles.itemPrice}>
                  {formatCurrency(item.price)}
                </p>
              </div>

              {/* Quantity controls */}
              <div style={styles.quantityControls}>
                <button
                  type="button"
                  style={styles.qtyButton}
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={isLoading}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span style={styles.qtyValue} aria-label="quantity">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  style={styles.qtyButton}
                  onClick={() => handleQuantityChange(item, +1)}
                  disabled={isLoading}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <p style={styles.subtotal}>{formatCurrency(subtotal)}</p>

              {/* Remove button */}
              <Button
                variant={isLoading ? 'disabled' : 'secondary'}
                size="small"
                onClick={() => handleRemove(item)}
                disabled={isLoading}
              >
                Remove
              </Button>
            </div>
          );
        })}
      </div>

      {/* Cart total */}
      <div style={styles.totalRow}>
        <span style={styles.totalLabel}>Total</span>
        <span style={styles.totalValue}>{formatCurrency(total)}</span>
      </div>

      {/* Proceed to checkout */}
      <div style={styles.checkoutAction}>
        <Button
          variant="primary"
          size="large"
          onClick={() => {
            window.location.href = '/checkout/summary';
          }}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}

// ─── inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '860px',
    margin: '0 auto',
    padding: '0 16px 40px',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPrice: {
    margin: 0,
    fontSize: '14px',
    color: '#6b7280',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  qtyButton: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  qtyValue: {
    minWidth: '24px',
    textAlign: 'center',
    fontSize: '15px',
    fontWeight: 500,
    color: '#111827',
  },
  subtotal: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    minWidth: '80px',
    textAlign: 'right',
    flexShrink: 0,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '24px',
    padding: '20px 16px',
    borderTop: '2px solid #e5e7eb',
    marginTop: '8px',
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#374151',
  },
  totalValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
  },
  checkoutAction: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 16px',
  },
  emptyText: {
    fontSize: '18px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  shopLink: {
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
  },
};
