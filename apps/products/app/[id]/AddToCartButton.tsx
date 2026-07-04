"use client";

import { useState } from "react";
import { Button } from "@yet-a-ecommerce/ui";
import { dispatch } from "@yet-a-ecommerce/communication";
import type { EventPayload } from "@yet-a-ecommerce/communication";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  stock: number;
}

export function AddToCartButton({
  productId,
  name,
  price,
  stock,
}: AddToCartButtonProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const outOfStock = stock === 0;

  function handleAddToCart(): void {
    if (outOfStock) return;

    const payload: EventPayload = {
      type: "cart:add",
      data: { productId, name, price, quantity: 1 },
      timestamp: Date.now(),
      source: "products",
    };

    dispatch("cart:add", payload);

    setNotification("Successfully added to cart!");
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }

  return (
    <div>
      {outOfStock ? (
        <p
          style={{
            color: "#ef4444",
            fontWeight: 600,
            fontSize: "14px",
            marginBottom: "12px",
          }}
        >
          Out of Stock
        </p>
      ) : null}

      <Button
        variant={outOfStock ? "disabled" : "primary"}
        size="large"
        onClick={handleAddToCart}
        disabled={outOfStock}
      >
        Add to Cart
      </Button>

      {notification !== null ? (
        <p
          role="status"
          aria-live="polite"
          style={{
            marginTop: "12px",
            color: "#10b981",
            fontWeight: 500,
            fontSize: "14px",
          }}
        >
          {notification}
        </p>
      ) : null}
    </div>
  );
}
