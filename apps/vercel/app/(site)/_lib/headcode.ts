import { fetchQuery } from 'convex/nextjs'
import {
  type FunctionArgs,
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
  makeFunctionReference,
} from 'convex/server'
import { cacheLife, cacheTag } from 'next/cache'

import { api } from '@/convex/_generated/api'
import { headcodeConfig } from '@/headcode/config'
import type { BlogMetaData } from '@/headcode/sections'
import type {
  DataHeadcode,
  HeadcodeVersion,
  ServiceEntry,
  ServiceEntryBundle,
  ServiceSection,
} from '@/headcode/types'
import { slugify } from '@/headcode/utils'

export type EntryBundle = ServiceEntryBundle

const entryConfigs = [...headcodeConfig.globals, ...headcodeConfig.collections]

// All site content is cached and prerendered per version. Admin and MCP
// writes expire this tag (app/(admin)/_lib/revalidate.ts, app/mcp/route.ts).
export const headcodeTag = 'headcode'

const cachedQuery = async (name: string, args: Record<string, unknown>) => {
  'use cache'
  cacheLife('hours')
  cacheTag(headcodeTag)
  return fetchQuery(makeFunctionReference<'query'>(name), args)
}

// Function references are proxies, so the cache key uses the function name.
const query = <Query extends FunctionReference<'query'>>(
  fn: Query,
  args: FunctionArgs<Query>,
) =>
  cachedQuery(getFunctionName(fn), args) as Promise<FunctionReturnType<Query>>

export const getHeadcodeGlobal = (version: HeadcodeVersion, slug: string) =>
  query(api.services.getGlobalWithSections, { slug, version })

export const getHeadcodeCollectionEntry = (
  version: HeadcodeVersion,
  slug: string,
  name: string,
) => query(api.services.getCollectionWithSections, { slug, name, version })

export const getHeadcodeCollectionEntries = (
  version: HeadcodeVersion,
  slug: string,
) => query(api.services.getCollectionsWithSections, { slug, version })

export const getHeadcodeSiteChrome = (version: HeadcodeVersion) =>
  query(api.services.getSiteChrome, { version })

export const getHeadcodeSitemapEntries = (version: HeadcodeVersion) =>
  query(api.services.getAll, { version })

export const getSection = <TData = unknown>(
  sections: ServiceSection[],
  name: string,
) =>
  sections.find((section) => section.name === name) as
    (ServiceSection & { data: TData }) | undefined

export const getBlogMetaSection = (bundle: EntryBundle) =>
  getSection<BlogMetaData>(bundle.sections, 'blog-meta')

export const getMeta = (bundle: EntryBundle) => {
  const blogMeta = getBlogMetaSection(bundle)?.data
  if (blogMeta) return { title: blogMeta.title, description: blogMeta.summary }
  return (
    getSection<{ title: string; description: string }>(bundle.sections, 'meta')
      ?.data ?? null
  )
}

export const getEntrySlug = (bundle: EntryBundle) =>
  slugify(bundle.entry.name ?? bundle.entry.slug)

export const getDataHeadcodeAttribute = (
  entry: ServiceEntry,
  section: ServiceSection,
) => {
  const entryConfig = entryConfigs.find((item) => item.slug === entry.slug)
  const sectionConfig = [entryConfig, ...entryConfigs]
    .flatMap((item): { name: string; description?: string }[] =>
      item ? [...item.sections] : [],
    )
    .find((item) => item.name === section.name)
  return JSON.stringify({
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
  } satisfies DataHeadcode)
}

export const formatDate = (value: number) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

export const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)
