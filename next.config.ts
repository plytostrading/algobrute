import type { NextConfig } from "next";

// Backend API base URL. `NEXT_PUBLIC_API_URL` is preferred (set in Cloud Run);
// `BACKEND_URL` is the legacy local-dev default. Cloud Run deploy points this
// at the engine VM, e.g. http://34.121.58.22:8000.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:4001";

const nextConfig: NextConfig = {
  // Standalone output: produces a self-contained .next/standalone tree
  // that can be copied into a slim Cloud Run container (see Dockerfile).
  output: "standalone",

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
