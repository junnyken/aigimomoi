import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.angimom.vn',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      // English URL aliases -> Public Vietnamese routes
      { source: '/recipes', destination: '/mon-an' },
      { source: '/recipe/:slug', destination: '/cong-thuc/:slug' },
      { source: '/recipes/:slug', destination: '/cong-thuc/:slug' },
      { source: '/meal-builder', destination: '/mam-com' },
      { source: '/shopping-list', destination: '/di-cho' },
      { source: '/pantry', destination: '/tu-lanh' },
      { source: '/weekly-planner', destination: '/ke-hoach-tuan' },
      { source: '/diary', destination: '/nhat-ky' },
      // Vietnamese URL aliases -> Editor routes
      { source: '/quan-tri/nguyen-lieu', destination: '/editor/ingredients' },
      { source: '/quan-tri/phan-loai', destination: '/editor/taxonomies' },
      { source: '/quan-tri/cong-thuc', destination: '/editor/recipes' },
      { source: '/quan-tri/cong-thuc/:path*', destination: '/editor/recipes/:path*' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
