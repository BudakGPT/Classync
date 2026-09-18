import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import type { NextConfig } from "next";

// The shared .env lives at the repo root, but `next dev` only reads apps/web/.env*.
// Load the root file without overriding anything already set (Vercel, shell, apps/web/.env).
loadEnv({ path: resolve(__dirname, "../../.env"), override: false });

const nextConfig: NextConfig = {
  transpilePackages: ["@classync/core"],
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;
