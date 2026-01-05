import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL('https://37ayrsdoek.ufs.sh/f/**'),
      new URL('https://olvzsyunffi8p5qo.public.blob.vercel-storage.com/**'),
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
