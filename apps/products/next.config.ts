import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/products",
  assetPrefix: "/products",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
