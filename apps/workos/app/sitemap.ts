import type { MetadataRoute } from 'next'

import { headers } from 'next/headers'

import { getHeadcodeSitemapEntries } from '@/app/(site)/_lib/headcode'
import { siteUrl } from '@/app/(site)/_lib/seo'
import { getHeadcodeVersionForHost } from '@/headcode/versions'
import { entryPath } from '@/headcode/utils'
import type { ServiceEntry } from '@/headcode/types'

const url = (
  path: string,
  { modificationTime }: ServiceEntry,
  changeFrequency: 'weekly' | 'monthly' = 'monthly',
  priority = 0.8,
) => ({
  url: `${siteUrl}/${path.replace(/^\/+|\/+$/g, '')}`,
  lastModified: new Date(modificationTime),
  changeFrequency,
  priority,
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host') ?? ''
  const { globals, collections } = await getHeadcodeSitemapEntries(
    getHeadcodeVersionForHost(host),
  )
  const global = (slug: string) =>
    globals.filter((entry) => entry.slug === slug).slice(0, 1)
  const collection = (slug: string) =>
    collections
      .filter((entry) => entry.slug === slug)
      .map((entry) => url(entryPath(entry), entry))

  return [
    ...global('home').map((entry) => url('/', entry, 'weekly', 1)),
    ...global('docs').map((entry) => url('docs', entry)),
    ...global('pricing').map((entry) => url('pricing', entry)),
    ...collection('blog'),
    ...collection('pages'),
  ]
}
