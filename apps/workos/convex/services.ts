import { paginationOptsValidator } from 'convex/server'
import { type ObjectType, type PropertyValidators, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'
import type { HeadcodeFieldConfig, ServiceSection } from '../headcode/types'
import { requireHeadcodeUser } from './authorization'
import * as db from './db'
import { mcpTokenArg, sectionFields, versionArg } from './schema_validators'
import {
  getSectionConfig,
  isRecord,
  validateSection,
  validateSectionForStorage,
} from './section_validations'

// Service boundary for site, admin, and MCP. Admin reads require a WorkOS
// user, writes an editor (see authorization.ts) or an MCP bearer token.
const adminMutation = <Args extends PropertyValidators, Result>(
  args: Args,
  handler: (ctx: MutationCtx, args: ObjectType<Args>) => Promise<Result>,
) =>
  mutation({
    args: { ...args, ...mcpTokenArg },
    handler: async (ctx, { mcpToken, ...rest }) => {
      await requireHeadcodeUser(ctx, mcpToken, true)
      return handler(ctx, rest as ObjectType<Args>)
    },
  })

const adminQuery = <Args extends PropertyValidators, Result>(
  args: Args,
  handler: (ctx: QueryCtx, args: ObjectType<Args>) => Promise<Result>,
) =>
  query({
    args: { ...args, ...mcpTokenArg },
    handler: async (ctx, { mcpToken, ...rest }) => {
      await requireHeadcodeUser(ctx, mcpToken)
      return handler(ctx, rest as ObjectType<Args>)
    },
  })

// Image fields store { imageId }; reads replace them with the image record.
const hydrate = async (
  ctx: QueryCtx,
  fields: Record<string, HeadcodeFieldConfig>,
  data: unknown,
): Promise<unknown> => {
  if (!isRecord(data)) return data
  const hydrateField = async (field: HeadcodeFieldConfig, value: unknown) => {
    if (Array.isArray(field))
      return Array.isArray(value)
        ? Promise.all(value.map((item) => hydrate(ctx, field[0] ?? {}, item)))
        : []
    if (
      field.type !== 'image' ||
      !isRecord(value) ||
      typeof value.imageId !== 'string'
    )
      return value
    return (
      (await ctx.db.get(value.imageId as Id<'images'>).catch(() => null)) ??
      null
    )
  }
  return Object.fromEntries(
    await Promise.all(
      Object.entries(fields).map(async ([key, field]) => [
        key,
        await hydrateField(field, data[key]),
      ]),
    ),
  )
}

const hydrateSection = async (
  ctx: QueryCtx,
  section: ServiceSection | null,
): Promise<ServiceSection | null> =>
  section && {
    ...section,
    data: await hydrate(
      ctx,
      getSectionConfig(section.name).fields,
      section.data,
    ),
  }

const hydrateSections = (ctx: QueryCtx, sections: (ServiceSection | null)[]) =>
  Promise.all(sections.map((section) => hydrateSection(ctx, section)))

const getEntryBundle = async (ctx: QueryCtx, entry: Doc<'entries'>) => ({
  entry,
  sections: (
    await hydrateSections(ctx, await db.getSections(ctx, entry._id))
  ).filter((section) => section !== null),
})

const touchEntry = (ctx: MutationCtx, entry: Id<'entries'>) =>
  ctx.db.patch(entry, { modificationTime: Date.now() })

const assertSectionAllowed = async (
  ctx: QueryCtx,
  entryId: Id<'entries'>,
  sectionName: string,
) => {
  getSectionConfig(sectionName)
  const entry = await ctx.db.get(entryId)
  if (!entry) throw new Error('Entry not found.')
  const config = db.getEntryConfig(entry)
  if (!config) throw new Error(`Entry "${entry.slug}" is not configured.`)
  if (!config.sections.some((section) => section.name === sectionName))
    throw new Error(
      `Section "${sectionName}" is not configured for entry "${entry.slug}".`,
    )
}

// Versions

export const getVersionStatus = query({
  args: {},
  handler: async (ctx) => {
    const versions = await ctx.db.query('versions').take(1000)
    const live = versions.find((version) => version.live) ?? null
    const draft = versions.find((version) => version.draft) ?? null
    const shared = Boolean(live && draft && live._id === draft._id)

    return {
      live,
      draft,
      shared,
      canPublish: Boolean(live && draft && !shared),
      canNewDraft: Boolean(live && (!draft || shared)),
    }
  },
})

export const getVersionHistory = adminQuery({}, async (ctx) =>
  ctx.db.query('versions').order('desc').take(1000),
)

export const publish = adminMutation({}, async (ctx) => {
  const live = await db.ensureVersionId(ctx, 'live')
  const draft = (await db.getVersionId(ctx, 'draft')) ?? live
  if (live !== draft) await ctx.db.patch(live, { live: false })
  await ctx.db.patch(draft, { live: true })
  return db.newDraft(ctx)
})

export const newDraft = adminMutation({}, db.newDraft)

export const restoreLiveVersion = adminMutation(
  { versionId: v.id('versions') },
  (ctx, { versionId }) => db.restoreLiveVersion(ctx, versionId),
)

export const deleteVersion = adminMutation(
  { versionId: v.id('versions') },
  (ctx, { versionId }) => db.deleteVersion(ctx, versionId),
)

// Entries

export const getAll = query({
  args: versionArg,
  handler: async (ctx, args) => {
    const version = await db.getVersionId(ctx, args.version)
    if (!version) return { globals: [], collections: [] }
    return {
      globals: await db.getGlobals(ctx, version),
      collections: await db.getCollections(ctx, undefined, version),
    }
  },
})

export const getGlobalWithSections = query({
  args: { slug: v.string(), ...versionArg },
  handler: async (ctx, args) => {
    const version = await db.getVersionId(ctx, args.version)
    const global = version && (await db.getGlobal(ctx, args.slug, version))
    return global ? getEntryBundle(ctx, global) : null
  },
})

export const getCollectionWithSections = query({
  args: { slug: v.string(), name: v.string(), ...versionArg },
  handler: async (ctx, args) => {
    const version = await db.getVersionId(ctx, args.version)
    const entry =
      version && (await db.getCollection(ctx, args.slug, args.name, version))
    return entry ? getEntryBundle(ctx, entry) : null
  },
})

export const getCollectionsWithSections = query({
  args: { slug: v.optional(v.string()), ...versionArg },
  handler: async (ctx, args) => {
    const version = await db.getVersionId(ctx, args.version)
    if (!version) return []
    const entries = await db.getCollections(ctx, args.slug, version)
    return Promise.all(entries.map((entry) => getEntryBundle(ctx, entry)))
  },
})

export const getSiteChrome = query({
  args: versionArg,
  handler: async (ctx, args) => {
    const version = await db.getVersionId(ctx, args.version)
    const bundle = async (slug: string) => {
      const global = version && (await db.getGlobal(ctx, slug, version))
      return global ? getEntryBundle(ctx, global) : null
    }
    const [header, footer] = await Promise.all([
      bundle('header'),
      bundle('footer'),
    ])
    return { header, footer }
  },
})

export const getEntry = query({
  args: { id: v.id('entries') },
  handler: (ctx, args) => ctx.db.get(args.id),
})

export const ensureGlobal = adminMutation(
  { slug: v.string(), ...versionArg },
  async (ctx, args) => {
    const version = await db.ensureVersionId(ctx, args.version)
    const existing = await db.getGlobal(ctx, args.slug, version)
    return (
      existing?._id ??
      db.createEntry(ctx, { slug: args.slug, name: null }, version)
    )
  },
)

export const addCollection = adminMutation(
  { slug: v.string(), name: v.string(), ...versionArg },
  async (ctx, { slug, name, version }) => {
    const versionId = await db.ensureVersionId(ctx, version)
    if (await db.getCollection(ctx, slug, name, versionId))
      throw new Error(`Collection entry "${slug}/${name}" already exists.`)
    return db.createEntry(ctx, { slug, name }, versionId)
  },
)

export const updateEntryName = adminMutation(
  { id: v.id('entries'), name: v.string() },
  (ctx, { id, name }) =>
    ctx.db.patch(id, { name, modificationTime: Date.now() }),
)

export const deleteEntry = adminMutation(
  { id: v.id('entries') },
  (ctx, { id }) => ctx.db.delete(id),
)

// Sections

export const getSection = query({
  args: { id: v.id('sections') },
  handler: async (ctx, args) =>
    hydrateSection(ctx, validateSection(await ctx.db.get(args.id))),
})

export const getSections = query({
  args: { id: v.id('entries') },
  handler: async (ctx, args) =>
    hydrateSections(ctx, await db.getSections(ctx, args.id)),
})

export const addSection = adminMutation(sectionFields, async (ctx, section) => {
  await assertSectionAllowed(ctx, section.entry, section.name)
  const id = await db.addSection(ctx, section)
  await touchEntry(ctx, section.entry)
  return id
})

export const updateSection = adminMutation(
  { id: v.id('sections'), ...sectionFields },
  async (ctx, { id, ...section }) => {
    await assertSectionAllowed(ctx, section.entry, section.name)
    await ctx.db.replace(id, validateSectionForStorage(section))
    await touchEntry(ctx, section.entry)
  },
)

export const reorderSections = adminMutation(
  { sections: v.array(v.object({ id: v.id('sections'), pos: v.int64() })) },
  async (ctx, { sections }) => {
    const entries = new Set<Id<'entries'>>()
    for (const { id, pos } of sections) {
      const existing = await ctx.db.get(id)
      if (!existing) throw new Error('Section not found.')
      await ctx.db.patch(id, { pos })
      entries.add(existing.entry)
    }
    for (const entry of entries) await touchEntry(ctx, entry)
  },
)

// Inserts a copy right after the original and renumbers positions in steps of 100.
export const duplicateSection = adminMutation(
  { id: v.id('sections') },
  async (ctx, { id }) => {
    const section = await ctx.db.get(id)
    if (!section) throw new Error('Section not found.')
    await assertSectionAllowed(ctx, section.entry, section.name)

    const sections = await db.getSections(ctx, section.entry)
    const index = sections.findIndex((item) => item?._id === id)
    if (index < 0) throw new Error('Section not found.')

    for (const [i, item] of sections.entries())
      if (item)
        await ctx.db.patch(item._id, {
          pos: BigInt((i <= index ? i + 1 : i + 2) * 100),
        })

    const copyId = await db.addSection(ctx, {
      name: section.name,
      pos: BigInt((index + 2) * 100),
      data: section.data,
      entry: section.entry,
    })
    await touchEntry(ctx, section.entry)
    return copyId
  },
)

export const deleteSection = adminMutation(
  { id: v.id('sections') },
  async (ctx, { id }) => {
    const section = await ctx.db.get(id)
    await ctx.db.delete(id)
    if (section) await touchEntry(ctx, section.entry)
  },
)

// Images

export const getImages = query({
  args: {
    filter: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: (ctx, args) => {
    const filter = args.filter?.trim().toLowerCase()
    return filter
      ? ctx.db
          .query('images')
          .withSearchIndex('search_filter', (q) => q.search('filter', filter))
          .paginate(args.paginationOpts)
      : ctx.db.query('images').order('desc').paginate(args.paginationOpts)
  },
})

export const getImage = query({
  args: { id: v.id('images') },
  handler: (ctx, args) => ctx.db.get(args.id),
})

const imageFilter = (...values: string[]) =>
  values.filter(Boolean).join(' ').toLowerCase()

export const updateImageMetadata = adminMutation(
  { id: v.id('images'), name: v.string(), alt: v.string() },
  async (ctx, { id, name, alt }) => {
    const image = await ctx.db.get(id)
    if (!image) throw new Error('Image not found.')
    await ctx.db.patch(id, {
      name,
      alt,
      filter: imageFilter(name, alt, image.type),
    })
  },
)

const referencesImage = (value: unknown, id: Id<'images'>): boolean =>
  Array.isArray(value)
    ? value.some((item) => referencesImage(item, id))
    : isRecord(value) &&
      (value.imageId === id ||
        Object.values(value).some((item) => referencesImage(item, id)))

// Counts sections (across all versions) that reference the image.
const countImageUsage = async (ctx: QueryCtx, id: Id<'images'>) =>
  (await ctx.db.query('sections').take(1000)).filter((section) => {
    try {
      return referencesImage(JSON.parse(section.data), id)
    } catch {
      return false
    }
  }).length

export const getImageUsage = adminQuery(
  { id: v.id('images') },
  async (ctx, { id }) => ({
    count: await countImageUsage(ctx, id),
  }),
)

export const deleteImage = adminMutation(
  { id: v.id('images') },
  async (ctx, { id }) => {
    const image = await ctx.db.get(id)
    if (!image) return { deleted: false }
    if ((await countImageUsage(ctx, id)) > 0)
      throw new Error('Image is used by content and cannot be deleted.')
    await ctx.storage.delete(image.storageId)
    await ctx.db.delete(id)
    return { deleted: true }
  },
)

export const generateImageUploadUrl = adminMutation({}, (ctx) =>
  ctx.storage.generateUploadUrl(),
)

export const getUploadedImageUrl = adminQuery(
  { storageId: v.id('_storage') },
  (ctx, { storageId }) => ctx.storage.getUrl(storageId),
)

export const addUploadedImage = adminMutation(
  {
    storageId: v.id('_storage'),
    alt: v.string(),
    width: v.int64(),
    height: v.int64(),
    blurDataURL: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.int64(),
  },
  async (ctx, args) => {
    const src = await ctx.storage.getUrl(args.storageId)
    if (!src) throw new Error('Uploaded image is not available.')
    const image = {
      ...args,
      src,
      filter: imageFilter(args.name, args.alt, args.type),
    }
    return { _id: await ctx.db.insert('images', image), ...image }
  },
)
