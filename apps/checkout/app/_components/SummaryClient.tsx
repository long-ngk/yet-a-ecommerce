'use client';

/**
 * SummaryClient — interactive Checkout Summary page.
 *
 * Displays order summary with items list, subtotal, shipping, discount, total.
 * Valid discount code (SAVE10) reduces total by 10%.
 * Invalid/expired code shows "Invalid or expired discount code".
 * "Place Order" button calls POST /api/orders, shows confirmation on success.
 * On success clears Shared Store cart and dispatches cart:update with totalCount 0.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@yet-a-ecommerce/ui';
import { dispatch, clearStore, readStore } from '@yet-a-ecommerce/communication';
import { getCart, createOrder, type CartItem, type Order } from '../../lib/api-client';

// ─── Discount codes ───────────────────────────────────────────────────────────

const DISCOUNT_CODES: Record<string, number> = {
  SAVE10: 0.1, // 10 % off
};

const SHIPPING_FEE = 5.99;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SummaryClientProps {
  /** Cart items pre-fetched on the server (may be empty on SSR errors). */
  initialItems: CartItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SummaryClient({ initialItems }: SummaryClientProps) {
  // Cart state
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [cartLoading, setCartLoading] = useState(false);

  // Form fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // Discount
  const [discountInput, setDiscountInput] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [appliedCode, setAppliedCode] = useState('');
  const [discountError, setDiscountError] = useState('');

  // Order submission
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // On mount: attempt to read fresh cart from API, fall back to Shared Store
  useEffect(() => {
    if (initialItems.length > 0) return; // server already populated

    setCartLoading(true);

    getCart()
      .then((cart) => setItems(cart.items))
      .catch(() => {
        // Fall back to Shared Store
        const stored = readStore<CartItem[]>('checkout', 'cart');
        if (stored) setItems(stored);
      })
      .finally(() => setCartLoading(false));
  }, [initialItems.length]);

  // ── Derived totals ─────────────────────────────────────────────────────────

  const subtotal = calcSubtotal(items);
  const discountAmount = subtotal * discountRate;
  const total = subtotal + SHIPPING_FEE - discountAmount;

  // ── Discount handler ────────────────────────────────────────────────────────

  const handleApplyDiscount = useCallback(() => {
    const code = discountInput.trim().toUpperCase();
    setDiscountError('');

    if (DISCOUNT_CODES[code] !== undefined) {
      // valid code — apply discount
      setDiscountRate(DISCOUNT_CODES[code]!);
      setAppliedCode(code);
    } else {
      // invalid / expired code
      setDiscountRate(0);
      setAppliedCode('');
      setDiscountError('Invalid or expired discount code');
    }
  }, [discountInput]);

  const handleRemoveDiscount = useCallback(() => {
    setDiscountRate(0);
    setAppliedCode('');
    setDiscountInput('');
    setDiscountError('');
  }, []);

  // ── Place order handler ─────────────────────────────────────────────────────

  const handlePlaceOrder = useCallback(async () => {
    if (!shippingAddress.trim()) {
      setOrderError('Please enter a shipping address.');
      return;
    }

    setPlacing(true);
    setOrderError('');

    try {
      // POST /api/orders
      const order = await createOrder(shippingAddress.trim(), paymentMethod);

      // clear cart from Shared Store
      clearStore('checkout', 'cart');

      // dispatch cart:update with totalCount 0
      dispatch('cart:update', {
        type: 'cart:update',
        data: { items: [], totalCount: 0 },
        timestamp: Date.now(),
        source: 'checkout',
      });

      setConfirmedOrder(order);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      setOrderError(message);
    } finally {
      setPlacing(false);
    }
  }, [shippingAddress, paymentMethod]);

  // ── Confirmation screen ─────────────────────────────────────────────────────

  if (confirmedOrder) {
    return (
      <div style={styles.confirmation} role="status" aria-live="polite">
        <div style={styles.confirmIcon} aria-hidden="true">✓</div>
        <h2 style={styles.confirmTitle}>Order Placed Successfully!</h2>
        <p style={styles.confirmText}>
          Your order <strong>#{confirmedOrder.id.slice(0, 8).toUpperCase()}</strong> has been
          received and is being processed.
        </p>
        <p style={styles.confirmAmount}>
          Total charged: <strong>{formatCurrency(confirmedOrder.totalAmount)}</strong>
        </p>
        <div style={styles.confirmActions}>
          <a href="/orders" style={styles.viewOrdersLink}>
            View My Orders
          </a>
          <a href="/products" style={styles.shopMoreLink}>
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  // ── Loading spinner ─────────────────────────────────────────────────────────

  if (cartLoading) {
    return (
      <div style={styles.loading} aria-busy="true">
        <p>Loading your order summary…</p>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>Your cart is empty.</p>
        <a href="/products" style={styles.shopLink}>
          Browse Products
        </a>
      </div>
    );
  }

  // ── Main summary view ───────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* ── Order items ──────────────────────────────── */}
      <section style={styles.section} aria-labelledby="items-heading">
        <h2 id="items-heading" style={styles.sectionTitle}>
          Order Items
        </h2>

        <div style={styles.itemList}>
          {items.map((item) => {
            const subtotalItem = item.price * item.quantity;
            return (
              <div key={item.id} style={styles.itemRow}>
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
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemMeta}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <p style={styles.itemSubtotal}>{formatCurrency(subtotalItem)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Discount code ───────────────────────────── */}
      <section style={styles.section} aria-labelledby="discount-heading">
        <h2 id="discount-heading" style={styles.sectionTitle}>
          Discount Code
        </h2>

        {appliedCode ? (
          <div style={styles.appliedDiscount}>
            <span style={styles.appliedBadge}>
              {appliedCode} — {(discountRate * 100).toFixed(0)}% off
            </span>
            <button type="button" style={styles.removeCodeBtn} onClick={handleRemoveDiscount}>
              Remove
            </button>
          </div>
        ) : (
          <div style={styles.discountRow}>
            <input
              type="text"
              value={discountInput}
              onChange={(e) => {
                setDiscountInput(e.target.value);
                setDiscountError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyDiscount();
              }}
              placeholder="Enter discount code"
              style={styles.discountInput}
              aria-label="Discount code"
              aria-describedby={discountError ? 'discount-error' : undefined}
            />
            <Button variant="secondary" size="medium" onClick={handleApplyDiscount}>
              Apply
            </Button>
          </div>
        )}

        {discountError && (
          <p id="discount-error" style={styles.errorText} role="alert">
            {discountError}
          </p>
        )}
      </section>

      {/* ── Shipping address ────────────────────────── */}
      <section style={styles.section} aria-labelledby="shipping-heading">
        <h2 id="shipping-heading" style={styles.sectionTitle}>
          Shipping Address
        </h2>
        <textarea
          value={shippingAddress}
          onChange={(e) => {
            setShippingAddress(e.target.value);
            if (orderError) setOrderError('');
          }}
          placeholder="Enter your full shipping address"
          rows={3}
          style={styles.textarea}
          aria-label="Shipping address"
          aria-required="true"
        />
      </section>

      {/* ── Payment method ──────────────────────────── */}
      <section style={styles.section} aria-labelledby="payment-heading">
        <h2 id="payment-heading" style={styles.sectionTitle}>
          Payment Method
        </h2>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={styles.select}
          aria-label="Payment method"
        >
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="PayPal">PayPal</option>
        </select>
      </section>

      {/* ── Order totals ─────────────────────────────── */}
      {/* show subtotal, shipping, discount, total */}
      <section style={styles.totalsSection} aria-labelledby="totals-heading">
        <h2 id="totals-heading" style={styles.sectionTitle}>
          Order Summary
        </h2>

        <div style={styles.totalsGrid}>
          <span style={styles.totalsLabel}>Subtotal</span>
          <span style={styles.totalsValue}>{formatCurrency(subtotal)}</span>

          <span style={styles.totalsLabel}>Shipping</span>
          <span style={styles.totalsValue}>{formatCurrency(SHIPPING_FEE)}</span>

          {discountAmount > 0 && (
            <>
              <span style={styles.totalsLabel}>
                Discount ({appliedCode})
              </span>
              <span style={{ ...styles.totalsValue, color: '#16a34a' }}>
                −{formatCurrency(discountAmount)}
              </span>
            </>
          )}

          <span style={styles.totalLabel}>Total</span>
          <span style={styles.totalValue}>{formatCurrency(total)}</span>
        </div>
      </section>

      {/* ── Place order ──────────────────────────────── */}
      {orderError && (
        <p style={styles.errorText} role="alert">
          {orderError}
        </p>
      )}

      <div style={styles.placeOrderAction}>
        <Button
          variant={placing ? 'disabled' : 'primary'}
          size="large"
          disabled={placing}
          onClick={handlePlaceOrder}
        >
          {placing ? 'Placing Order…' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '0 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 16px',
    color: '#6b7280',
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
  section: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  totalsSection: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
    marginTop: 0,
    marginBottom: '16px',
  },
  // Items
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemImage: {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '6px',
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: '56px',
    height: '56px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    margin: '0 0 2px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
  },
  itemSubtotal: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    flexShrink: 0,
  },
  // Discount
  discountRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  discountInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  appliedDiscount: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  appliedBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 600,
  },
  removeCodeBtn: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
  errorText: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#dc2626',
  },
  // Shipping / payment inputs
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '180px',
  },
  // Totals
  totalsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px 16px',
    alignItems: 'baseline',
  },
  totalsLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: '14px',
    color: '#374151',
    textAlign: 'right' as const,
  },
  totalLabel: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111827',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '10px',
    marginTop: '4px',
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    textAlign: 'right' as const,
    borderTop: '1px solid #e5e7eb',
    paddingTop: '10px',
    marginTop: '4px',
  },
  // Place order button
  placeOrderAction: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  // Confirmation
  confirmation: {
    maxWidth: '560px',
    margin: '40px auto',
    padding: '40px 32px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #d1fae5',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  confirmIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontWeight: 700,
  },
  confirmTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    marginTop: 0,
    marginBottom: '12px',
  },
  confirmText: {
    fontSize: '15px',
    color: '#374151',
    marginBottom: '8px',
  },
  confirmAmount: {
    fontSize: '15px',
    color: '#374151',
    marginBottom: '28px',
  },
  confirmActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  viewOrdersLink: {
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
  },
  shopMoreLink: {
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
  },
};
