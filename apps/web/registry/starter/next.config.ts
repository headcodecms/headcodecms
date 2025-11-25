import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      // new URL('https://<APP_ID>.ufs.sh/f/**'),
      // new URL('https://<STORE_ID>.public.blob.vercel-storage.com/**'),
    ],
  },
}

export default nextConfig
