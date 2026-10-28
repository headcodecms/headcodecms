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
import type { Id } from '@/convex/_generated/dataModel'
import { validateSection } from '@/convex/section_validations'
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

// Default content for empty installs, built from the config defaults.
const defaultBundle = (
  config: (typeof entryConfigs)[number],
  name: string | null,
  index: number,
): EntryBundle => {
  const time = Date.UTC(2026, 0, 1) + index
  const id = `default-entry-${config.slug}-${name ?? 'global'}`.replace(
    /[^a-zA-Z0-9_-]/g,
    '-',
  ) as Id<'entries'>
  return {
    entry: {
      _id: id,
      _creationTime: time,
      slug: config.slug,
      name,
      modificationTime: time,
      version: 'default-version' as Id<'versions'>,
    },
    sections: config.defaults.map((section, pos) =>
      validateSection({
        _id: `${id}-section-${pos}` as Id<'sections'>,
        _creationTime: time + pos,
        entry: id,
        name: section.name,
        pos: BigInt(pos),
        data: JSON.stringify(section.data),
      }),
    ),
  }
}

const defaultGlobal = (slug: string) => {
  const config = headcodeConfig.globals.find((item) => item.slug === slug)
  return config ? defaultBundle(config, null, 0) : null
}

const defaultCollection = (slug: string) => {
  const config = headcodeConfig.collections.find((item) => item.slug === slug)
  if (!config) return []
  const meta = config.defaults.find(
    (section) => section.name === 'meta' || section.name === 'blog-meta',
  )?.data as { title?: string } | undefined
  return [defaultBundle(config, meta?.title ?? config.slug, 100)]
}

export const getHeadcodeGlobal = async (
  version: HeadcodeVersion,
  slug: string,
) =>
  (await query(api.services.getGlobalWithSections, { slug, version })) ??
  defaultGlobal(slug)

export const getHeadcodeCollectionEntry = async (
  version: HeadcodeVersion,
  slug: string,
  name: string,
) =>
  (await query(api.services.getCollectionWithSections, {
    slug,
    name,
    version,
  })) ??
  defaultCollection(slug).find(
    (bundle) => getEntrySlug(bundle) === name || bundle.entry.name === name,
  ) ??
  null

export const getHeadcodeCollectionEntries = async (
  version: HeadcodeVersion,
  slug: string,
) => {
  const entries = await query(api.services.getCollectionsWithSections, {
    slug,
    version,
  })
  return entries.length > 0 ? entries : defaultCollection(slug)
}

export const getHeadcodeSiteChrome = async (version: HeadcodeVersion) => {
  const chrome = await query(api.services.getSiteChrome, { version })
  return {
    header: chrome.header ?? defaultGlobal('header'),
    footer: chrome.footer ?? defaultGlobal('footer'),
  }
}

export const getHeadcodeSitemapEntries = async (version: HeadcodeVersion) => {
  const { globals, collections } = await query(api.services.getAll, {
    version,
  })
  return {
    globals: globals.length
      ? globals
      : ['home', 'docs', 'pricing'].flatMap(
          (slug) => defaultGlobal(slug)?.entry ?? [],
        ),
    collections: collections.length
      ? collections
      : [...defaultCollection('blog'), ...defaultCollection('pages')].map(
          (bundle) => bundle.entry,
        ),
  }
}

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
