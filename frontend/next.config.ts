import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
    ],
  },
  async headers() {
    return [
      {
        source: "/replay-lab/export",
        headers: [
          {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
          {key: "Cross-Origin-Embedder-Policy", value: "require-corp"},
        ],
      },
    ];
  },
};

export default nextConfig;
