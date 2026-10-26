import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP: chỉ cho phép script/khung từ chính site + Cloudflare Turnstile.
// 'unsafe-inline' cho script vẫn cần vì Next chèn script khởi tạo inline (chưa dùng nonce).
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

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
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
  async rewrites() {
    return [
      // English URL aliases -> Public Vietnamese routes
      { source: '/recipes', destination: '/mon-an' },
      { source: '/recipe/:slug', destination: '/cong-thuc/:slug' },
      { source: '/recipes/:slug', destination: '/cong-thuc/:slug' },
      { source: '/calorie-calculator', destination: '/tinh-calo' },
      { source: '/tdee', destination: '/tinh-calo' },
      { source: '/meal-builder', destination: '/meal' },
      { source: '/mam-com', destination: '/meal' },
      { source: '/shopping-list', destination: '/shopping' },
      { source: '/di-cho', destination: '/shopping' },
      { source: '/pantry', destination: '/tu-lanh' },
      { source: '/weekly-planner', destination: '/ke-hoach-tuan' },
      { source: '/diary', destination: '/nhat-ky' },
      { source: '/about', destination: '/gioi-thieu' },
      { source: '/faq', destination: '/hoi-dap' },
      { source: '/privacy', destination: '/chinh-sach-bao-mat' },
      { source: '/terms', destination: '/dieu-khoan' },
      // Vietnamese URL aliases -> Admin & Editor routes
      { source: '/quan-tri', destination: '/admin-login' },
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
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
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
