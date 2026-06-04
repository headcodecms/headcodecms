import type { MetadataRoute } from 'next'
import { headcodeConfig } from './config'
import { DataHeadcode, ServiceEntry, ServiceSection } from './types'

type SitemapEntry = MetadataRoute.Sitemap[number]

export const jsonConfig = () => {
  return JSON.stringify(headcodeConfig)
}

export const getDataHeadcode = (
  entry: ServiceEntry,
  section: ServiceSection,
): DataHeadcode => {
  const entryConfig = findEntryConfig(entry.slug)
  const sectionConfig =
    entryConfig?.sections.find((item) => item.name === section.name) ??
    findSection(section.name)

  return {
    entry: {
      id: entry._id,
      slug: entry.slug,
      name: entry.name,
      modificationTime: entry.modificationTime,
      description: entryConfig?.description,
    },
    section: {
      id: section._id,
      name: section.name,
      pos: Number(section.pos),
      description: sectionConfig?.description,
    },
  }
}

export const getDataHeadcodeAttribute = (
  entry: ServiceEntry,
  section: ServiceSection,
) => JSON.stringify(getDataHeadcode(entry, section))

const findEntryConfig = (slug: string) =>
  [...headcodeConfig.globals, ...headcodeConfig.collections].find(
    (item) => item.slug === slug,
  ) ?? null

export const findSection = (name: string) => {
  for (const entryConfig of [
    ...headcodeConfig.globals,
    ...headcodeConfig.collections,
  ]) {
    const section = entryConfig.sections.find((item) => item.name === name)
    if (section) return section
  }

  return null
}

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )

const normalizePath = (path: string) => `/${path.replace(/^\/+|\/+$/g, '')}`

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getEntryPath = (entry: ServiceEntry, path?: string) => {
  const basePath = path ?? `/${entry.slug}`
  if (entry.name === null) return normalizePath(basePath)

  return normalizePath(`${basePath}/${slugify(entry.name)}`)
}

export const getSitemapUrls = (
  entries: ServiceEntry[],
  path?: string,
): MetadataRoute.Sitemap =>
  entries.map((entry) =>
    getSitemapUrl(getEntryPath(entry, path), entry.modificationTime),
  )

export const getSitemapUrl = (
  path: string,
  lastModified: Date | number | string = new Date(),
  changeFrequency: SitemapEntry['changeFrequency'] = 'monthly',
  priority = 0.8,
): SitemapEntry => {
  return {
    url: `${siteUrl()}${normalizePath(path)}`,
    lastModified:
      lastModified instanceof Date ? lastModified : new Date(lastModified),
    changeFrequency,
    priority,
  }
}
