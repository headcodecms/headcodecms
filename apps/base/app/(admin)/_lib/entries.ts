import { headcodeConfig } from '@/headcode/config'
import type { HeadcodeSectionConfig } from '@/headcode/types'
import { entryPath } from '@/headcode/utils'

export type EntryConfig = {
  slug: string
  path?: string
  sections: HeadcodeSectionConfig[]
  defaults: { name: string; data: unknown }[]
}

// Entry slugs: a global by its slug (`home`), a collection item as
// `<collection>/<name>` (`blog/hello`).
export const parseSlug = (slug: string) => {
  const slash = slug.indexOf('/')
  return slash < 0
    ? { type: slug, name: null }
    : { type: slug.slice(0, slash), name: slug.slice(slash + 1) }
}

export const entryConfig = (slug: string) => {
  const { type, name } = parseSlug(slug)
  const configs: EntryConfig[] =
    name === null ? headcodeConfig.globals : headcodeConfig.collections
  return configs.find((config) => config.slug === type)
}

// Path shown in the admin, as in version 2 (/home, /blog/hello).
export const displayPath = (slug: string) => {
  const { type, name } = parseSlug(slug)
  return entryPath({ slug: type, name })
}

// The site page of an entry; globals without a page (header, footer) show on
// every page, so their link goes to the home page.
export const sitePath = (slug: string) => {
  const { type, name } = parseSlug(slug)
  return name === null
    ? (entryConfig(slug)?.path ?? '/')
    : entryPath({ slug: type, name })
}

export const editorHref = (slug: string) => `/admin/entries/${slug}`
