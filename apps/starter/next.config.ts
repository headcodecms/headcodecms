import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL('https://37ayrsdoek.ufs.sh/f/**'),
      new URL('https://olvzsyunffi8p5qo.public.blob.vercel-storage.com/**'),
    ],
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
