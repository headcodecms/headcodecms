import type { MetadataRoute } from 'next'

import { getHeadcodeSitemapEntries } from '@/app/(site)/_lib/headcode'
import { getSitemapUrl, getSitemapUrls } from '@/headcode/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { globals, collections } = await getHeadcodeSitemapEntries()
  const home = globals.find((entry) => entry.slug === 'home')
  const docs = globals.find((entry) => entry.slug === 'docs')
  const pricing = globals.find((entry) => entry.slug === 'pricing')
  const blogPosts = collections.filter((entry) => entry.slug === 'blog')
  const pages = collections.filter((entry) => entry.slug === 'pages')

  return [
    home ? getSitemapUrl('/', home.modificationTime, 'weekly', 1) : null,
    docs ? getSitemapUrl('/docs', docs.modificationTime) : null,
    pricing ? getSitemapUrl('/pricing', pricing.modificationTime) : null,
    ...getSitemapUrls(blogPosts, '/blog'),
    ...getSitemapUrls(pages, '/pages'),
  ].filter((entry): entry is MetadataRoute.Sitemap[number] => Boolean(entry))
}
