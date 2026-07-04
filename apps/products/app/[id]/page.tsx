import { notFound } from "next/navigation";
import Image from "next/image";
import { getProduct } from "@/lib/api-client";
import { AddToCartButton } from "./AddToCartButton";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "32px 16px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Back link */}
      <a
        href="/products"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: "#3b82f6",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "24px",
        }}
      >
        ← Back to Products
      </a>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* Product image */}
        <div
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            overflow: "hidden",
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "14px" }}>
              No image available
            </span>
          )}
        </div>

        {/* Product info */}
        <div>
          {/* Category */}
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            {product.category}
          </p>

          {/* Name */}
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "12px",
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h1>

          {/* Price */}
          <p
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#3b82f6",
              marginBottom: "20px",
            }}
          >
            {formattedPrice}
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: "15px",
              color: "#374151",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            {product.description}
          </p>

          {/* Specs */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Specifications
            </h2>
            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "6px 16px",
                fontSize: "14px",
              }}
            >
              <dt style={{ color: "#6b7280", fontWeight: 500 }}>Category</dt>
              <dd style={{ color: "#111827", margin: 0 }}>{product.category}</dd>

              <dt style={{ color: "#6b7280", fontWeight: 500 }}>Stock</dt>
              <dd style={{ color: "#111827", margin: 0 }}>
                {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
              </dd>

              <dt style={{ color: "#6b7280", fontWeight: 500 }}>Product ID</dt>
              <dd style={{ color: "#111827", margin: 0, fontFamily: "monospace", fontSize: "12px" }}>
                {product.id}
              </dd>
            </dl>
          </div>

          {/* Add to Cart */}
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={product.price}
            stock={product.stock}
          />
        </div>
      </div>
    </main>
  );
}
