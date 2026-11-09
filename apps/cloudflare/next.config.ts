import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['draft.localhost'],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    maximumResponseBody: 2 * 1024 * 1024,
    // Uploaded images are served from /media (headcode/images.ts).
    localPatterns: [{ pathname: '/media/**' }],
  },
}

export default nextConfig
