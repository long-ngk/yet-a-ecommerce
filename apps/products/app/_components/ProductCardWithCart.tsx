'use client';

import { ProductCard } from '@yet-a-ecommerce/ui';
import { dispatch } from '@yet-a-ecommerce/communication';
import type { EventPayload } from '@yet-a-ecommerce/communication';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export function ProductCardWithCart({ product }: { product: Product }) {
  function handleAddToCart() {
    const payload: EventPayload = {
      type: 'cart:add',
      data: { productId: product.id, name: product.name, price: product.price, quantity: 1 },
      timestamp: Date.now(),
      source: 'products',
    };
    dispatch('cart:add', payload);
  }

  return (
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
  );
}
