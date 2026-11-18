import type { MetadataRoute } from 'next'

import { siteUrl } from '@/app/(site)/_lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/preview'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
