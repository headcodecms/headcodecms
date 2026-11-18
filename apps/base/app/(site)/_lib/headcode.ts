import { revalidateTag } from 'next/cache'

import { headcodeConfig } from '@/headcode/config'
import type { BlogMetaData } from '@/headcode/sections'
import type {
  DataHeadcode,
  Fields,
  HeadcodeVersion,
  ServiceEntry,
  ServiceEntryBundle,
  ServiceSection,
} from '@/headcode/types'
import { slugifyPath } from '@/headcode/utils'

export type EntryBundle = ServiceEntryBundle

const entryConfigs = [...headcodeConfig.globals, ...headcodeConfig.collections]

// The backend (apps/backend) and this site's project in it.
const backendUrl = (
  process.env.HEADCODE_URL ?? 'http://localhost:3080'
).replace(/\/$/, '')
const project = process.env.HEADCODE_PROJECT ?? 'demo'

// All site content is cached. A publish expires this tag.
export const headcodeTag = 'headcode'

export const expireSite = () => revalidateTag(headcodeTag, { expire: 0 })

type BackendEntry = {
  slug: string
  sections: { name: string; data: unknown }[]
  updated_at: string
}

// The open live endpoints of the backend, cached for an hour or until a
// publish expires the tag. Draft follows with sign-in.
const fetchLive = async (path: string) => {
  const res = await fetch(`${backendUrl}/p/${project}/live${path}`, {
    next: { revalidate: 3600, tags: [headcodeTag] },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Headcode backend: ${res.status} for ${path}`)
  return res.json()
}

const sectionFields = new Map<string, Fields>(
  entryConfigs.flatMap((config) =>
    config.sections.map((section) => [section.name, section.fields as Fields]),
  ),
)

// Each field is parsed on its own: an invalid field falls back to its default,
// so one bad value does not take the whole section down.
const parseData = (name: string, data: unknown) => {
  const fields = sectionFields.get(name)
  if (!fields) return data
  const values = (data && typeof data === 'object' ? data : {}) as Record<
    string,
    unknown
  >
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => {
      const parsed = field.safeParse(values[key])
      if (parsed.success) return [key, parsed.data]
      console.warn(`[headcode] Invalid field "${name}.${key}". Using default.`)
      return [key, field.parse(undefined)]
    }),
  )
}

const toBundle = ({
  slug,
  sections,
  updated_at,
}: BackendEntry): EntryBundle => {
  const [type, name] = slug.includes('/') ? slug.split('/', 2) : [slug, null]
  return {
    entry: {
      _id: slug,
      slug: type,
      name,
      modificationTime: Date.parse(updated_at),
    },
    sections: sections.map((section, pos) => ({
      _id: `${slug}#${pos}`,
      name: section.name,
      pos,
      data: parseData(section.name, section.data),
    })),
  }
}

const getEntry = async (version: HeadcodeVersion, slug: string) => {
  if (version !== 'live') throw new Error('Draft preview is not available yet.')
  const entry = (await fetchLive(`/${slug}`)) as BackendEntry | null
  return entry && toBundle(entry)
}

const getEntries = async (version: HeadcodeVersion, prefix = '') => {
  if (version !== 'live') throw new Error('Draft preview is not available yet.')
  const { entries } = (await fetchLive(
    `?prefix=${encodeURIComponent(prefix)}`,
  )) as { entries: BackendEntry[] }
  return entries.map(toBundle)
}

export const getHeadcodeGlobal = (version: HeadcodeVersion, slug: string) =>
  getEntry(version, slug)

export const getHeadcodeCollectionEntry = (
  version: HeadcodeVersion,
  slug: string,
  name: string,
) => getEntry(version, `${slug}/${name}`)

export const getHeadcodeCollectionEntries = (
  version: HeadcodeVersion,
  slug: string,
) => getEntries(version, `${slug}/`)

export const getHeadcodeSiteChrome = async (version: HeadcodeVersion) => {
  const [header, footer] = await Promise.all([
    getEntry(version, 'header'),
    getEntry(version, 'footer'),
  ])
  return { header, footer }
}

export const getHeadcodeSitemapEntries = async (version: HeadcodeVersion) => {
  const entries = (await getEntries(version)).map((bundle) => bundle.entry)
  return {
    globals: entries.filter((entry) => entry.name === null),
    collections: entries.filter((entry) => entry.name !== null),
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
  slugifyPath(bundle.entry.name ?? bundle.entry.slug)

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
