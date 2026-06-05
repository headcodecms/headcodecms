import type { NextConfig } from 'next'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convexHostname = convexUrl ? new URL(convexUrl).hostname : undefined

const nextConfig: NextConfig = {
  allowedDevOrigins: ['headcode.localhost', 'draft.headcode.localhost'],
  images: {
    maximumResponseBody: 2 * 1024 * 1024,
    remotePatterns: convexHostname
      ? [
          {
            protocol: 'https',
            hostname: convexHostname,
            pathname: '/api/storage/**',
          },
        ]
      : [],
  },
}

export default nextConfig
