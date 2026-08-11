import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the app always has a usable AI fallback in production if unset.
  env: {
    AI_PROVIDER: process.env.AI_PROVIDER || "mock",
  },
};

export default nextConfig;
