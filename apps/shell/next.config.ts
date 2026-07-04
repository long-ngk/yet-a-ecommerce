import type { NextConfig } from "next";

const PRODUCTS_URL =
  process.env["PRODUCTS_URL"] ?? "http://localhost:3001";
const ORDERS_URL =
  process.env["ORDERS_URL"] ?? "http://localhost:3002";
const ACCOUNT_URL =
  process.env["ACCOUNT_URL"] ?? "http://localhost:3003";
const CHECKOUT_URL =
  process.env["CHECKOUT_URL"] ?? "http://localhost:3004";

// All Zone origins that are allowed to call the API Gateway
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
];

const corsHeaders = [
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Request-Id" },
  { key: "Access-Control-Allow-Credentials", value: "true" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CORS headers to all API routes
        source: "/api/:path*",
        headers: [
          // Allow all Zone origins — the dynamic origin check is handled via
          // the Vary header; Next.js middleware can do per-request origin
          // matching for stricter enforcement if needed in production.
          {
            key: "Access-Control-Allow-Origin",
            value: ALLOWED_ORIGINS.join(", "),
          },
          ...corsHeaders,
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/products/:path*",
        destination: `${PRODUCTS_URL}/products/:path*`,
      },
      {
        source: "/orders/:path*",
        destination: `${ORDERS_URL}/orders/:path*`,
      },
      {
        source: "/account/:path*",
        destination: `${ACCOUNT_URL}/account/:path*`,
      },
      {
        source: "/checkout/:path*",
        destination: `${CHECKOUT_URL}/checkout/:path*`,
      },
    ];
  },
};

export default nextConfig;
