'use client';

import { useState } from 'react';
import { ProductCard } from '@yet-a-ecommerce/ui';
import { dispatch, writeStore } from '@yet-a-ecommerce/communication';
import { addToCart, getCart } from '@/lib/api-client';
import type { EventPayload } from '@yet-a-ecommerce/communication';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export function ProductCardWithCart({ product }: { product: Product }) {
  const [notification, setNotification] = useState<string | null>(null);

  async function handleAddToCart() {
    try {
      // Call API to add to cart
      await addToCart(product.id, 1);

      // Fetch updated cart to get total count
      const cart = await getCart();

      // Write full cart to store for checkout app
      writeStore('checkout', 'cart', cart.items);

      // Dispatch event to update badge
      const payload: EventPayload = {
        type: 'cart:update',
        data: { totalCount: cart.items.length },
        timestamp: Date.now(),
        source: 'products',
      };

      dispatch('cart:update', payload);

      // Show success notification
      setNotification('Successfully added to cart!');
      setTimeout(() => {
        setNotification(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setNotification(
        err instanceof Error ? err.message : 'Failed to add to cart'
      );
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }

  return (
    <>
      <ProductCard
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] ?? '',
          stock: product.stock,
        }}
        href={`/products/${product.id}`}
        onAddToCart={handleAddToCart}
      />
      {notification && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor:
              notification.includes('Failed') ? '#fee2e2' : '#dcfce7',
            color: notification.includes('Failed') ? '#991b1b' : '#166534',
            border:
              notification.includes('Failed')
                ? '1px solid #fca5a5'
                : '1px solid #86efac',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {notification}
        </div>
      )}
    </>
  );
}
