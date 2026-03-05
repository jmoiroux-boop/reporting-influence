import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx-js-style"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Polyfill __dirname for NCC compiled modules on Vercel
      config.node = {
        ...config.node,
        __dirname: true,
      };
    }
    return config;
  },
};

export default nextConfig;
