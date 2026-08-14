import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN network IPs and localhost for dev requests without cross-origin warnings
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "10.183.133.37:3000",
    "10.183.133.37",
  ],
};

export default nextConfig;
