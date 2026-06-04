import { Id } from '../_generated/dataModel'
import { MutationCtx, QueryCtx } from '../_generated/server'
import { headcodeConfig } from '../../headcode/config'
import { addDBSection } from './sections'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const getDBGlobals = async (ctx: QueryCtx, version: Id<'versions'>) => {
  const slugs = headcodeConfig.globals.map((item) => item.slug)

  const globals = await ctx.db
    .query('entries')
    .withIndex('by_version', (q) => q.eq('version', version))
    .take(1000)

  return globals.filter((global) => slugs.includes(global.slug))
}

export const getDBGlobal = async (
  ctx: QueryCtx,
  slug: string,
  version: Id<'versions'>,
) => {
  const slugs = headcodeConfig.globals.map((item) => item.slug)
  if (!slugs.includes(slug)) return null

  return await ctx.db
    .query('entries')
    .withIndex('by_slug', (q) => q.eq('slug', slug).eq('version', version))
    .unique()
}

export const getDBCollections = async (
  ctx: QueryCtx,
  slug: string | undefined | null,
  version: Id<'versions'>,
) => {
  const slugs = headcodeConfig.collections.map((item) => item.slug)

  if (slug) {
    if (!slugs.includes(slug)) return []
    return await ctx.db
      .query('entries')
      .withIndex('by_slug', (q) => q.eq('slug', slug).eq('version', version))
      .take(1000)
  }

  const collections = await ctx.db
    .query('entries')
    .withIndex('by_version', (q) => q.eq('version', version))
    .take(1000)

  return collections.filter((collection) => slugs.includes(collection.slug))
}

export const getDBCollection = async (
  ctx: QueryCtx,
  slug: string,
  name: string,
  version: Id<'versions'>,
) => {
  const slugs = headcodeConfig.collections.map((item) => item.slug)
  if (!slugs.includes(slug)) return null

  return await ctx.db
    .query('entries')
    .withIndex('by_slug_and_name', (q) =>
      q.eq('slug', slug).eq('name', name).eq('version', version),
    )
    .unique()
}

export const getDBCollectionByNameOrSlug = async (
  ctx: QueryCtx,
  slug: string,
  nameOrSlug: string,
  version: Id<'versions'>,
) => {
  const exact = await getDBCollection(ctx, slug, nameOrSlug, version)
  if (exact) return exact

  const entries = await getDBCollections(ctx, slug, version)
  return (
    entries.find(
      (entry) => entry.name !== null && slugify(entry.name) === nameOrSlug,
    ) ?? null
  )
}

export const ensureDBGlobal = async (
  ctx: MutationCtx,
  slug: string,
  version: Id<'versions'>,
) => {
  const globalConfig = headcodeConfig.globals.find((item) => item.slug === slug)
  if (!globalConfig) {
    throw new Error(`Unknown global "${slug}".`)
  }

  const existing = await getDBGlobal(ctx, slug, version)
  if (existing) return existing._id

  const entryId = await ctx.db.insert('entries', {
    slug,
    name: null,
    modificationTime: Date.now(),
    version,
  })

  for (const [index, section] of globalConfig.defaults.entries()) {
    await addDBSection(ctx, {
      name: section.name,
      pos: BigInt(index),
      data: JSON.stringify(section.data),
      entry: entryId,
    })
  }

  return entryId
}

export const addDBCollection = async (
  ctx: MutationCtx,
  slug: string,
  name: string,
  version: Id<'versions'>,
) => {
  const collectionConfig = headcodeConfig.collections.find(
    (item) => item.slug === slug,
  )
  if (!collectionConfig) {
    throw new Error(`Unknown collection "${slug}".`)
  }

  const existing = await getDBCollection(ctx, slug, name, version)
  if (existing) {
    throw new Error(`Collection entry "${slug}/${name}" already exists.`)
  }

  const entryId = await ctx.db.insert('entries', {
    slug,
    name,
    modificationTime: Date.now(),
    version,
  })

  for (const [index, section] of collectionConfig.defaults.entries()) {
    await addDBSection(ctx, {
      name: section.name,
      pos: BigInt(index),
      data: JSON.stringify(section.data),
      entry: entryId,
    })
  }

  return entryId
}
