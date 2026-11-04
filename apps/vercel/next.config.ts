import type { NextConfig } from 'next'

const convexHost = new URL(process.env.NEXT_PUBLIC_CONVEX_URL!).hostname

const nextConfig: NextConfig = {
  allowedDevOrigins: ['draft.localhost'],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    maximumResponseBody: 2 * 1024 * 1024,
    remotePatterns: [
      { protocol: 'https', hostname: convexHost, pathname: '/api/storage/**' },
    ],
  },
}

export default nextConfig
