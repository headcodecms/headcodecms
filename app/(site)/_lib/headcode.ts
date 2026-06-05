import { fetchQuery } from 'convex/nextjs'
import { headers } from 'next/headers'

import { Id, TableNames } from '@/convex/_generated/dataModel'
import { api } from '@/convex/_generated/api'
import { validateSection } from '@/convex/section_validations'
import { headcodeConfig } from '@/headcode/config'
import { getHeadcodeVersionForHost } from '@/headcode/versions'
import type {
  HeadcodeVersion,
  ServiceEntryBundle,
  ServiceSection,
} from '@/headcode/types'

export type EntryBundle = ServiceEntryBundle

type ConfigEntry = (typeof headcodeConfig.globals)[number]
type ConfigCollection = (typeof headcodeConfig.collections)[number]
type DefaultGlobalSection = ConfigEntry['defaults'][number]
type DefaultCollectionSection = ConfigCollection['defaults'][number]
type DefaultSection = DefaultGlobalSection | DefaultCollectionSection

const versionId = 'default-version' as Id<'versions'>
const fallbackTime = Date.UTC(2026, 0, 1)

const idFor = <TTable extends TableNames>(value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-') as Id<TTable>

const getRequestHost = async () => {
  const requestHeaders = await headers()

  return (
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
  )
}

export const getHeadcodeVersion = async (): Promise<HeadcodeVersion> => {
  return getHeadcodeVersionForHost(await getRequestHost())
}

const getDefaultEntryName = (slug: string, defaults: DefaultSection[]) => {
  const metaSection = defaults.find(
    (section) => section.name === 'meta' || section.name === 'blog-meta',
  )
  const data = metaSection?.data as { title?: string } | undefined
  return data?.title ?? slug
}

const toDefaultServiceEntry = (
  slug: string,
  name: string | null,
  index: number,
) => ({
  _id: idFor<'entries'>(`default-entry-${slug}-${name ?? 'global'}`),
  _creationTime: fallbackTime + index,
  slug,
  name,
  modificationTime: fallbackTime + index,
  version: versionId,
})

const toDefaultServiceSections = (
  entry: ReturnType<typeof toDefaultServiceEntry>,
  defaults: DefaultSection[],
) =>
  defaults.map((section, index) => {
    const validated = validateSection({
      _id: idFor<'sections'>(`${entry._id}-section-${index}`),
      _creationTime: entry._creationTime + index,
      entry: entry._id,
      name: section.name,
      pos: BigInt(index),
      data: JSON.stringify(section.data),
    })

    if (!validated) {
      throw new Error(`Unable to validate default section "${section.name}".`)
    }

    return validated
  })

const toDefaultEntryBundle = (
  slug: string,
  name: string | null,
  defaults: DefaultSection[],
  index: number,
): EntryBundle => {
  const entry = toDefaultServiceEntry(slug, name, index)
  return {
    entry,
    sections: toDefaultServiceSections(entry, defaults),
  }
}

const getDefaultGlobal = (slug: string) => {
  const config = headcodeConfig.globals.find((item) => item.slug === slug)
  if (!config) return null

  return toDefaultEntryBundle(config.slug, null, config.defaults, 0)
}

const getDefaultCollectionEntries = (slug: string) => {
  const config = headcodeConfig.collections.find((item) => item.slug === slug)
  if (!config) return []

  return [
    toDefaultEntryBundle(
      config.slug,
      getDefaultEntryName(config.slug, config.defaults),
      config.defaults,
      100,
    ),
  ]
}

const getDefaultCollectionEntry = (slug: string, nameOrSlug: string) => {
  const entries = getDefaultCollectionEntries(slug)
  return (
    entries.find(
      ({ entry }) =>
        slugify(entry.name ?? entry.slug) === nameOrSlug ||
        entry.name === nameOrSlug,
    ) ?? null
  )
}

export const getHeadcodeGlobal = async (slug: string) => {
  const version = await getHeadcodeVersion()

  return (
    (await fetchQuery(api.services.getGlobalWithSections, { slug, version })) ??
    getDefaultGlobal(slug)
  )
}

export const getHeadcodeCollectionEntry = async (
  slug: string,
  name: string,
) => {
  const version = await getHeadcodeVersion()

  return (
    (await fetchQuery(api.services.getCollectionWithSections, {
      slug,
      name,
      version,
    })) ?? getDefaultCollectionEntry(slug, name)
  )
}

export const getHeadcodeCollectionEntries = async (slug: string) => {
  const version = await getHeadcodeVersion()
  const entries = await fetchQuery(api.services.getCollectionsWithSections, {
    slug,
    version,
  })

  return entries.length > 0 ? entries : getDefaultCollectionEntries(slug)
}

export const getHeadcodeSiteChrome = async () => {
  const version = await getHeadcodeVersion()
  const chrome = await fetchQuery(api.services.getSiteChrome, { version })

  return {
    header: chrome.header ?? getDefaultGlobal('header'),
    footer: chrome.footer ?? getDefaultGlobal('footer'),
  }
}

export const getHeadcodeSitemapEntries = async () => {
  const version = await getHeadcodeVersion()
  const entries = await fetchQuery(api.services.getAll, { version })
  const globals =
    entries.globals.length > 0
      ? entries.globals
      : ['home', 'docs', 'pricing']
          .map((slug) => getDefaultGlobal(slug)?.entry)
          .filter((entry) => entry !== undefined)
  const collections =
    entries.collections.length > 0
      ? entries.collections
      : [
          ...getDefaultCollectionEntries('blog'),
          ...getDefaultCollectionEntries('pages'),
        ].map((bundle) => bundle.entry)

  return { globals, collections }
}

export const getSection = <TData = unknown>(
  sections: ServiceSection[],
  name: string,
) =>
  sections.find((section) => section.name === name) as
    | (ServiceSection & { data: TData })
    | undefined

export const getMeta = (bundle: EntryBundle) => {
  const meta = getSection<{ title: string; description: string }>(
    bundle.sections,
    'meta',
  )
  const blogMeta = getSection<{ title: string; summary: string }>(
    bundle.sections,
    'blog-meta',
  )

  if (blogMeta) {
    return {
      title: blogMeta.data.title,
      description: blogMeta.data.summary,
    }
  }

  return meta?.data ?? null
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const getEntrySlug = (bundle: EntryBundle) =>
  slugify(bundle.entry.name ?? bundle.entry.slug)
