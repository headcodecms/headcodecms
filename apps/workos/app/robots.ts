import type { MetadataRoute } from 'next'

import { headers } from 'next/headers'

import { siteUrl } from '@/app/(site)/_lib/seo'
import { getHeadcodeVersionForHost } from '@/headcode/versions'

// Draft hosts stay out of search engines; live points crawlers to the sitemap.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') ?? ''
  return getHeadcodeVersionForHost(host) === 'draft'
    ? { rules: { userAgent: '*', disallow: '/' } }
    : {
        rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/mcp'] },
        sitemap: `${siteUrl}/sitemap.xml`,
      }
}
