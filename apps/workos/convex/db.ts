import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { headcodeConfig } from '../headcode/config'
import { slugify } from '../headcode/utils'
import type { HeadcodeVersionInput, SectionInput } from './schema_validators'
import {
  validateSection,
  validateSectionForStorage,
} from './section_validations'

type Ctx = QueryCtx | MutationCtx
type EntryConfig =
  | (typeof headcodeConfig.globals)[number]
  | (typeof headcodeConfig.collections)[number]

const globalSlugs = headcodeConfig.globals.map((item) => item.slug)
const collectionSlugs = headcodeConfig.collections.map((item) => item.slug)

// Versions

const findVersion = async (ctx: Ctx, version: HeadcodeVersionInput) => {
  const versions = await ctx.db
    .query('versions')
    .withIndex(version === 'live' ? 'by_live' : 'by_draft', (q) =>
      q.eq(version, true),
    )
    .take(2)
  if (versions.length > 1)
    throw new Error(`Multiple ${version} versions found.`)
  return versions[0] ?? null
}

// Returns null only for an empty install; reads never create versions.
export const getVersionId = async (ctx: Ctx, version: HeadcodeVersionInput) => {
  const found = await findVersion(ctx, version)
  if (found) return found._id
  if ((await ctx.db.query('versions').take(1)).length > 0)
    throw new Error(`No ${version} version found.`)
  return null
}

// The first write creates one version that is both live and draft.
export const ensureVersionId = async (
  ctx: MutationCtx,
  version: HeadcodeVersionInput,
) =>
  (await getVersionId(ctx, version)) ??
  (await ctx.db.insert('versions', { live: true, draft: true }))

const cloneVersion = async (
  ctx: MutationCtx,
  source: Id<'versions'>,
  flags: { live: boolean; draft: boolean },
) => {
  const version = await ctx.db.insert('versions', flags)
  for (const entry of await getEntries(ctx, source)) {
    const entryId = await ctx.db.insert('entries', {
      slug: entry.slug,
      name: entry.name,
      modificationTime: Date.now(),
      version,
    })
    for (const { name, pos, data } of await getRawSections(ctx, entry._id))
      await ctx.db.insert('sections', { name, pos, data, entry: entryId })
  }
  return version
}

export const newDraft = async (ctx: MutationCtx) => {
  const live = await ensureVersionId(ctx, 'live')
  const oldDraft = await findVersion(ctx, 'draft')
  if (oldDraft) await ctx.db.patch(oldDraft._id, { draft: false })
  return cloneVersion(ctx, live, { live: false, draft: true })
}

export const restoreLiveVersion = async (
  ctx: MutationCtx,
  versionId: Id<'versions'>,
) => {
  const source = await ctx.db.get(versionId)
  if (!source) throw new Error('Version not found.')
  if (source.live) throw new Error('Version is already live.')

  const oldLive = await findVersion(ctx, 'live')
  if (oldLive) await ctx.db.patch(oldLive._id, { live: false })
  return cloneVersion(ctx, versionId, { live: true, draft: false })
}

export const deleteVersion = async (
  ctx: MutationCtx,
  versionId: Id<'versions'>,
) => {
  const version = await ctx.db.get(versionId)
  if (!version) throw new Error('Version not found.')
  if (version.live || version.draft)
    throw new Error('Live and draft versions cannot be deleted.')

  let entries = 0
  let sections = 0
  for (const entry of await getEntries(ctx, versionId)) {
    for (const section of await getRawSections(ctx, entry._id)) {
      await ctx.db.delete(section._id)
      sections++
    }
    await ctx.db.delete(entry._id)
    entries++
  }
  await ctx.db.delete(versionId)
  return { deleted: true, entries, sections }
}

// Entries

export const getEntries = (ctx: Ctx, version: Id<'versions'>) =>
  ctx.db
    .query('entries')
    .withIndex('by_version', (q) => q.eq('version', version))
    .take(1000)

export const getGlobals = async (ctx: Ctx, version: Id<'versions'>) =>
  (await getEntries(ctx, version)).filter((entry) =>
    globalSlugs.includes(entry.slug),
  )

export const getGlobal = (ctx: Ctx, slug: string, version: Id<'versions'>) =>
  globalSlugs.includes(slug)
    ? ctx.db
        .query('entries')
        .withIndex('by_slug', (q) => q.eq('slug', slug).eq('version', version))
        .unique()
    : null

export const getCollections = async (
  ctx: Ctx,
  slug: string | undefined,
  version: Id<'versions'>,
) => {
  if (!slug)
    return (await getEntries(ctx, version)).filter((entry) =>
      collectionSlugs.includes(entry.slug),
    )
  if (!collectionSlugs.includes(slug)) return []
  return ctx.db
    .query('entries')
    .withIndex('by_slug', (q) => q.eq('slug', slug).eq('version', version))
    .take(1000)
}

// Finds a collection entry by exact name or by its URL slug.
export const getCollection = async (
  ctx: Ctx,
  slug: string,
  nameOrSlug: string,
  version: Id<'versions'>,
) => {
  if (!collectionSlugs.includes(slug)) return null
  const exact = await ctx.db
    .query('entries')
    .withIndex('by_slug_and_name', (q) =>
      q.eq('slug', slug).eq('name', nameOrSlug).eq('version', version),
    )
    .unique()
  if (exact) return exact
  return (
    (await getCollections(ctx, slug, version)).find(
      (entry) => entry.name !== null && slugify(entry.name) === nameOrSlug,
    ) ?? null
  )
}

export const getEntryConfig = (entry: Pick<Doc<'entries'>, 'slug' | 'name'>) =>
  (
    (entry.name === null
      ? headcodeConfig.globals
      : headcodeConfig.collections) as EntryConfig[]
  ).find((config) => config.slug === entry.slug) ?? null

// Creates an entry with the configured default sections.
export const createEntry = async (
  ctx: MutationCtx,
  entry: { slug: string; name: string | null },
  version: Id<'versions'>,
) => {
  const config = getEntryConfig(entry)
  const kind = entry.name === null ? 'global' : 'collection'
  if (!config) throw new Error(`Unknown ${kind} "${entry.slug}".`)

  const entryId = await ctx.db.insert('entries', {
    ...entry,
    modificationTime: Date.now(),
    version,
  })
  for (const [index, section] of config.defaults.entries())
    await addSection(ctx, {
      name: section.name,
      pos: BigInt(index),
      data: JSON.stringify(section.data),
      entry: entryId,
    })
  return entryId
}

// Sections

const getRawSections = (ctx: Ctx, entry: Id<'entries'>) =>
  ctx.db
    .query('sections')
    .withIndex('by_entry', (q) => q.eq('entry', entry))
    .take(1000)

export const getSections = async (ctx: Ctx, entry: Id<'entries'>) =>
  (await getRawSections(ctx, entry))
    .sort((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0))
    .map(validateSection)

export const addSection = (ctx: MutationCtx, section: SectionInput) =>
  ctx.db.insert('sections', validateSectionForStorage(section))
