/**
 * Order List page — maps to `/orders`.
 *
 * Displays the authenticated user's orders sorted newest first using OrderCard.
 * Redirects to login when the user is unauthenticated.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth-guard";
import { getOrders } from "@/lib/api-client";
import { OrderCard } from "@yet-a-ecommerce/ui";
import type { Order } from "@/lib/api-client";

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "32px 16px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "24px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "64px 16px",
  color: "#6b7280",
};

const emptyHeadingStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  marginBottom: "12px",
  color: "#374151",
};

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  padding: "10px 24px",
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: 500,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrdersPage() {
  // Auth guard — redirect to login when unauthenticated
  const session = await getSession();
  if (!session) {
    const shellUrl = process.env["SHELL_API_URL"] ?? "http://localhost:3000";
    redirect(`${shellUrl}/login?callbackUrl=${shellUrl}/orders`);
  }

  // Forward cookies so NextAuth session is validated server-side
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let orders: Order[] = [];

  try {
    const response = await getOrders(undefined, cookieHeader);
    orders = response.data;
  } catch {
    // If the API fails we show an empty state rather than crashing
    orders = [];
  }

  return (
    <main style={containerStyle}>
      <h1 style={headingStyle}>My Orders</h1>

      {orders.length === 0 ? (
        // Empty state
        <div style={emptyStyle}>
          <p style={emptyHeadingStyle}>You have no orders yet.</p>
          <p>Browse our products and place your first order.</p>
          <Link href="/products" style={linkStyle}>
            Shop now
          </Link>
        </div>
      ) : (
        // Order list (sorted newest first by API)
        <div style={gridStyle}>
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              style={{ textDecoration: "none" }}
            >
              <OrderCard
                order={{
                  id: order.id,
                  createdAt: new Date(order.createdAt),
                  totalAmount: order.totalAmount,
                  status: order.status,
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
