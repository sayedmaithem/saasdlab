import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack for local dev
  turbopack: {
    root: process.cwd(),
  },

  // Production image optimization — allow Supabase Storage CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mzvpnszmznlvthvlduzd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Suppress known benign warnings in prod
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
