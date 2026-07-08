/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: 'standalone', // Enable standalone output for Docker deployment
  serverExternalPackages: ['firebase-admin'],
  // Ensure all static assets are properly handled
  assetPrefix: process.env.NODE_ENV === 'production' ? '/' : '',
  async redirects() {
    return [
      {
        source: '/medicines',
        destination: '/vault',
        permanent: true,
      },
      {
        source: '/medicines/:path*',
        destination: '/vault/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
