import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL('https://store_KgtQTEvoofUeN1Xm.public.blob.vercel-storage.com/**'),
    ],
  },
}

export default nextConfig
