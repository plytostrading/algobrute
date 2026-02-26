import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Forward all /api/* requests to the FastAPI backend
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        // Forward all /auth/* requests to the FastAPI backend
        source: "/auth/:path*",
        destination: `${BACKEND_URL}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
