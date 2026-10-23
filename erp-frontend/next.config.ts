import type { NextConfig } from "next";

// Route browser API calls through the frontend origin. This keeps the auth
// cookies first-party when the UI and API are hosted by different providers.
const apiOrigin = (process.env.ERP_API_ORIGIN ?? "http://localhost:8080").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
