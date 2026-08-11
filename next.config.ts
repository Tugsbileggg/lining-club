import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Uploaded objects get a unique path per upload, so an optimized variant is
    // never stale. The default TTL is 4 hours, which made the optimizer rewrite
    // every variant six times a day and blew through the cache-write quota.
    // (Vercel may clamp this to its own ceiling; a longer value is harmless.)
    minimumCacheTTL: 31536000,
    // Each entry is another variant to generate and store per image. Sources are
    // capped at 1600px on upload, so anything wider would only upscale.
    deviceSizes: [640, 750, 1080, 1280, 1600],
    imageSizes: [64, 128, 256, 384],
    // Photos are already re-encoded to WebP in the browser before upload, so the
    // optimizer's second pass can be cheaper than the default 75.
    qualities: [60],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      // Example/placeholder product & collection imagery.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
