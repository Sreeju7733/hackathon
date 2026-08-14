import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "10.183.133.37:3000",
    "10.183.133.37",
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      // Prevent file-lock / rename race conditions on Linux tmpfs caches
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;

