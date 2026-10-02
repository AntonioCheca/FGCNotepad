import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-only Next.js badge clear of the mobile bottom navigation.
  devIndicators: {position: "top-right"},
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
    ],
  },
  async headers() {
    return [
      {
        source: "/replay-lab/:path(local|export)",
        headers: [
          {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
          {key: "Cross-Origin-Embedder-Policy", value: "require-corp"},
        ],
      },
      {
        source: "/ffmpeg-core/:path*",
        headers: [
          {key: "Cross-Origin-Opener-Policy", value: "same-origin"},
          {key: "Cross-Origin-Embedder-Policy", value: "require-corp"},
          {key: "Cross-Origin-Resource-Policy", value: "same-origin"},
          {key: "Cache-Control", value: "public, max-age=31536000, immutable"},
        ],
      },
    ];
  },
};

export default nextConfig;
