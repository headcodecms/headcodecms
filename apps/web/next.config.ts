import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL('https://kgtqtevoofuen1xm.public.blob.vercel-storage.com/**'),
    ],
  },
}

export default nextConfig
