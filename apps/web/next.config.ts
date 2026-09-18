import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@classync/core"],
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
