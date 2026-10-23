import type { NextConfig } from 'next'

// The Content-Security-Policy header is set per request in src/middleware.ts (it needs a nonce).

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  // Lets a production build (NEXT_DIST_DIR=.next-prod) run next to a dev server without sharing
  // `.next`, which otherwise makes every JS/CSS request return 400. Vercel uses the default.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Build checks stay ON: a deploy must fail loudly on type or lint errors.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,
  reactStrictMode: true,

  images: { unoptimized: true },

  // `standalone` is only for the Docker image; Vercel builds its own output.
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' as const } : {}),

  serverExternalPackages: ['firebase-admin'],

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Never cache authenticated API responses.
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ]
  },

  async redirects() {
    return [
      { source: '/vault', destination: '/vault/medicine', permanent: false },
      { source: '/medicines', destination: '/vault/medicine', permanent: false },
      { source: '/medicines/:path*', destination: '/vault/:path*', permanent: false },
    ]
  },
}

export default nextConfig
