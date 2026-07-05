"use client";

import { useState } from "react";
import { Button } from "@yet-a-ecommerce/ui";
import { dispatch } from "@yet-a-ecommerce/communication";
import { addToCart } from "@/lib/api-client";
import type { EventPayload } from "@yet-a-ecommerce/communication";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  stock: number;
}

export function AddToCartButton({
  productId,
  stock,
}: AddToCartButtonProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const outOfStock = stock === 0;

  async function handleAddToCart(): Promise<void> {
    if (outOfStock || loading) return;

    setLoading(true);

    try {
      // Call API to add to cart
      const cart = await addToCart(productId, 1);

      // Dispatch event to update Shared Store and UI
      const payload: EventPayload = {
        type: "cart:update",
        data: { totalCount: cart.items.length },
        timestamp: Date.now(),
        source: "products",
      };

      dispatch("cart:update", payload);

      setNotification("Successfully added to cart!");
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      setNotification(
        err instanceof Error ? err.message : "Failed to add to cart"
      );
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
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
        disabled={outOfStock || loading}
      >
        {loading ? "Adding..." : "Add to Cart"}
      </Button>

      {notification !== null ? (
        <p
          role="status"
          aria-live="polite"
          style={{
            marginTop: "12px",
            color: notification.includes("Failed") ? "#ef4444" : "#10b981",
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
