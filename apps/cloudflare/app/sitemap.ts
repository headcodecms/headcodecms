import type { MetadataRoute } from 'next'

import { headers } from 'next/headers'

import { getHeadcodeSitemapEntries } from '@/app/(site)/_lib/headcode'
import { siteUrl } from '@/app/(site)/_lib/seo'
import { headcodeConfig } from '@/headcode/config'
import type { ServiceEntry } from '@/headcode/types'
import { entryPath } from '@/headcode/utils'
import { getHeadcodeVersionForHost } from '@/headcode/versions'

// Every page: globals with a path in headcode/config.ts (not files like /llms.txt),
// and all collection entries.
const pagePaths: Record<string, string> = Object.fromEntries(
  headcodeConfig.globals.flatMap((global) =>
    'path' in global && global.path && !global.path.includes('.')
      ? [[global.slug, global.path]]
      : [],
  ),
)

const url = (path: string, { modificationTime }: ServiceEntry) => ({
  url: `${siteUrl}${path === '/' ? '' : path}`,
  lastModified: new Date(modificationTime),
  changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
  priority: path === '/' ? 1 : 0.8,
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get('host') ?? ''
  const { globals, collections } = await getHeadcodeSitemapEntries(
    getHeadcodeVersionForHost(host),
  )
  return [
    ...globals.flatMap((entry) =>
      pagePaths[entry.slug] ? [url(pagePaths[entry.slug], entry)] : [],
    ),
    ...collections.map((entry) => url(entryPath(entry), entry)),
  ]
}
