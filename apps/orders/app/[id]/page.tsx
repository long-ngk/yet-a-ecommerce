/**
 * Order Detail page — maps to `/orders/[id]`.
 *
 * Shows order items (with quantities and unit prices), shipping status,
 * and payment information (method, subtotal, shipping fee, total).
 * Redirects to login when the user is unauthenticated.
 */
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth-guard";
import { getOrder } from "@/lib/api-client";
import type { Order, OrderItem } from "@/lib/api-client";

// ─── Status helpers ───────────────────────────────────────────────────────────

type OrderStatus = Order["status"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  PROCESSING: { bg: "#dbeafe", text: "#1e40af" },
  SHIPPING: { bg: "#ede9fe", text: "#5b21b6" },
  DELIVERED: { bg: "#d1fae5", text: "#065f46" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

// ─── Shipping fee constant ────────────────────────────────────────────────────

// Shipping fee is a fixed charge — adjust if the API returns it directly
const SHIPPING_FEE = 5.99;

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
  padding: "32px 16px",
};

const backLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  color: "#3b82f6",
  textDecoration: "none",
  fontSize: "14px",
  marginBottom: "24px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "4px",
};

const subHeadingStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "24px",
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
  marginBottom: "24px",
  backgroundColor: "#ffffff",
};

const sectionHeaderStyle: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  padding: "14px 20px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const thStyle: React.CSSProperties = {
  padding: "12px 20px",
  textAlign: "left" as const,
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  borderBottom: "1px solid #f3f4f6",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 20px",
  fontSize: "14px",
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: "14px",
  color: "#374151",
};

const rowLabelStyle: React.CSSProperties = {
  color: "#6b7280",
};

const rowTotalStyle: React.CSSProperties = {
  ...rowStyle,
  fontWeight: 700,
  fontSize: "16px",
  color: "#111827",
  borderBottom: "none",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const subtotal = item.price * item.quantity;
  return (
    <tr>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500 }}>{item.product.name}</div>
        {item.product.images[0] ? (
          <img
            src={item.product.images[0]}
            alt={item.product.name}
            style={{ width: "48px", height: "48px", objectFit: "cover", marginTop: "6px", borderRadius: "4px" }}
          />
        ) : null}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" as const }}>
        {formatCurrency(item.price)}
      </td>
      <td style={{ ...tdStyle, textAlign: "center" as const }}>
        {item.quantity}
      </td>
      <td style={{ ...tdStyle, textAlign: "right" as const, fontWeight: 600 }}>
        {formatCurrency(subtotal)}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth guard — redirect to login when unauthenticated
  const session = await getSession();
  if (!session) {
    const shellUrl = process.env["SHELL_API_URL"] ?? "http://localhost:3000";
    redirect(`${shellUrl}/api/auth/signin?callbackUrl=${shellUrl}/orders`);
  }

  const { id } = await params;

  // Forward cookies for server-side auth
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let order: Order;
  try {
    order = await getOrder(id, cookieHeader);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      notFound();
    }
    throw err;
  }

  // Calculate subtotal from items
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <main style={containerStyle}>
      {/* Back navigation */}
      <Link href="/orders" style={backLinkStyle}>
        ← Back to orders
      </Link>

      {/* Heading */}
      <h1 style={headingStyle}>
        Order #{order.id.slice(-8).toUpperCase()}
      </h1>
      <p style={subHeadingStyle}>Placed on {formatDate(order.createdAt)}</p>

      {/* ── Shipping Status ── */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Shipping Status</div>
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <StatusBadge status={order.status} />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            {order.shippingAddress && `Shipping to: ${order.shippingAddress}`}
          </span>
        </div>
      </section>

      {/* ── Order Items ── */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Order Items</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={{ ...thStyle, textAlign: "right" as const }}>Unit Price</th>
              <th style={{ ...thStyle, textAlign: "center" as const }}>Qty</th>
              <th style={{ ...thStyle, textAlign: "right" as const }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Payment Info ── */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Payment Information</div>

        <div style={rowStyle}>
          <span style={rowLabelStyle}>Payment method</span>
          <span style={{ fontWeight: 500 }}>{order.paymentMethod}</span>
        </div>

        <div style={rowStyle}>
          <span style={rowLabelStyle}>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div style={rowStyle}>
          <span style={rowLabelStyle}>Shipping fee</span>
          <span>{formatCurrency(SHIPPING_FEE)}</span>
        </div>

        <div style={rowTotalStyle}>
          <span>Total payment</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </section>
    </main>
  );
}
