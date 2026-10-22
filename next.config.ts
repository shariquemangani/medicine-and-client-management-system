import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Content Security Policy.
 * - Next.js needs inline scripts/styles; `unsafe-eval` is only allowed in dev (React Fast Refresh).
 * - connect-src lists the Firebase endpoints used by Auth + Firestore (WebChannel / long polling).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://va.vercel-scripts.com https://apis.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com',
    'https://*.firebaseapp.com',
    'https://vitals.vercel-insights.com',
    'https://va.vercel-scripts.com',
  ].join(' '),
  "frame-src 'self' https://*.firebaseapp.com https://apis.google.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
      { source: '/medicines', destination: '/vault/medicine', permanent: true },
      { source: '/medicines/:path*', destination: '/vault/:path*', permanent: true },
    ]
  },
}

export default nextConfig
