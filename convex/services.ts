import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
  deleteDBVersion,
  ensureInitialVersion,
  getCurrentVersion,
  newDBDraft,
  restoreDBLiveVersion,
} from './db/versions'
import {
  addDBCollection,
  ensureDBGlobal,
  getDBCollection,
  getDBCollectionByNameOrSlug,
  getDBCollections,
  getDBGlobal,
  getDBGlobals,
} from './db/entries'
import {
  getSectionConfig,
  validateSection,
  validateSectionForStorage,
} from './section_validations'
import { addDBSection, getDBSections } from './db/sections'
import {
  collectionSlugAndNameArgs,
  entryFields,
  entryIdArg,
  entryNameArgs,
  imageFields,
  imageIdArg,
  mcpTokenArg,
  optionalFilterArg,
  optionalSlugWithVersionArgs,
  reorderSectionValidator,
  sectionFields,
  sectionIdArg,
  slugArg,
  versionArg,
  versionIdArg,
} from './schema_validators'
import type { HeadcodeVersionInput } from './schema_validators'
import { Doc, Id } from './_generated/dataModel'
import { MutationCtx, QueryCtx } from './_generated/server'
import type { HeadcodeFieldConfig, ServiceSection } from '../headcode/types'
import {
  requireHeadcodePublish,
  requireHeadcodeUser,
  requireHeadcodeWrite,
} from './authorization'
import { headcodeConfig } from '../headcode/config'

const getEntryBundle = async (ctx: QueryCtx, entry: Doc<'entries'>) => ({
  entry,
  sections: (
    await hydrateSections(ctx, await getDBSections(ctx, entry._id))
  ).filter((section) => section !== null),
})

const getVersionOrNull = async (ctx: QueryCtx, version: HeadcodeVersionInput) =>
  getCurrentVersion(ctx, version) as Promise<Id<'versions'> | null>

const touchEntry = async (ctx: MutationCtx, entry: Id<'entries'>) => {
  await ctx.db.patch(entry, { modificationTime: Date.now() })
}

const getEntryConfigForEntry = (entry: Doc<'entries'>) => {
  const entries = entry.name
    ? headcodeConfig.collections
    : headcodeConfig.globals
  return entries.find((config) => config.slug === entry.slug) ?? null
}

const assertSectionAllowedForEntry = async (
  ctx: QueryCtx,
  entryId: Id<'entries'>,
  sectionName: string,
) => {
  getSectionConfig(sectionName)

  const entry = await ctx.db.get(entryId)
  if (!entry) throw new Error('Entry not found.')

  const entryConfig = getEntryConfigForEntry(entry)
  if (!entryConfig) {
    throw new Error(`Entry "${entry.slug}" is not configured.`)
  }

  if (!entryConfig.sections.some((section) => section.name === sectionName)) {
    throw new Error(
      `Section "${sectionName}" is not configured for entry "${entry.slug}".`,
    )
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const hydrateImageField = async (ctx: QueryCtx, value: unknown) => {
  if (!isRecord(value) || typeof value.imageId !== 'string') return value

  try {
    return (await ctx.db.get(value.imageId as Id<'images'>)) ?? null
  } catch {
    return null
  }
}

const hydrateFieldData = async (
  ctx: QueryCtx,
  field: HeadcodeFieldConfig,
  value: unknown,
): Promise<unknown> => {
  if (Array.isArray(field)) {
    const itemFields = field[0] ?? {}
    if (!Array.isArray(value)) return []

    return Promise.all(
      value.map((item) => hydrateSectionData(ctx, itemFields, item)),
    )
  }

  if (field.type === 'image') {
    return hydrateImageField(ctx, value)
  }

  return value
}

const hydrateSectionData = async (
  ctx: QueryCtx,
  fields: Record<string, HeadcodeFieldConfig>,
  data: unknown,
) => {
  if (!isRecord(data)) return data

  const entries = await Promise.all(
    Object.entries(fields).map(async ([key, field]) => [
      key,
      await hydrateFieldData(ctx, field, data[key]),
    ]),
  )

  return Object.fromEntries(entries)
}

const hydrateSection = async (
  ctx: QueryCtx,
  section: ServiceSection | null,
): Promise<ServiceSection | null> => {
  if (!section) return null

  const sectionConfig = getSectionConfig(section.name)
  return {
    ...section,
    data: await hydrateSectionData(ctx, sectionConfig.fields, section.data),
  }
}

const hydrateSections = async (
  ctx: QueryCtx,
  sections: Array<ServiceSection | null>,
) => Promise.all(sections.map((section) => hydrateSection(ctx, section)))

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireHeadcodeUser(ctx).catch(() => null)
    if (!identity) return null

    return {
      name: identity.name ?? null,
      email: identity.email ?? null,
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
    }
  },
})

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
      canPublish: Boolean(live && draft && live._id !== draft._id),
      canNewDraft: Boolean(live && (!draft || live._id === draft._id)),
    }
  },
})

export const getVersionHistory = query({
  args: {},
  handler: async (ctx) => {
    await requireHeadcodeUser(ctx)
    return await ctx.db.query('versions').order('desc').take(1000)
  },
})

export const getGlobals = query({
  args: versionArg,
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return []
    return await getDBGlobals(ctx, version)
  },
})

export const getGlobal = query({
  args: {
    ...slugArg,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return null
    return await getDBGlobal(ctx, args.slug, version)
  },
})

export const getCollections = query({
  args: optionalSlugWithVersionArgs,
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return []
    return getDBCollections(ctx, args.slug, version)
  },
})

export const getCollection = query({
  args: {
    ...collectionSlugAndNameArgs,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return null
    return await getDBCollection(ctx, args.slug, args.name, version)
  },
})

export const getAll = query({
  args: versionArg,
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return { globals: [], collections: [] }
    const globals = await getDBGlobals(ctx, version)
    const collections = await getDBCollections(ctx, null, version)

    return { globals, collections }
  },
})

export const getGlobalWithSections = query({
  args: {
    ...slugArg,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getVersionOrNull(ctx, args.version)
    if (!version) return null
    const global = await getDBGlobal(ctx, args.slug, version)
    if (!global) return null

    return getEntryBundle(ctx, global)
  },
})

export const getCollectionWithSections = query({
  args: {
    ...collectionSlugAndNameArgs,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getVersionOrNull(ctx, args.version)
    if (!version) return null
    const collection = await getDBCollectionByNameOrSlug(
      ctx,
      args.slug,
      args.name,
      version,
    )
    if (!collection) return null

    return getEntryBundle(ctx, collection)
  },
})

export const getCollectionsWithSections = query({
  args: optionalSlugWithVersionArgs,
  handler: async (ctx, args) => {
    const version = await getVersionOrNull(ctx, args.version)
    if (!version) return []
    const collections = await getDBCollections(ctx, args.slug, version)

    return Promise.all(
      collections.map((collection) => getEntryBundle(ctx, collection)),
    )
  },
})

export const getSiteChrome = query({
  args: versionArg,
  handler: async (ctx, args) => {
    const version = await getVersionOrNull(ctx, args.version)
    if (!version) return { header: null, footer: null }
    const [header, footer] = await Promise.all([
      getDBGlobal(ctx, 'header', version),
      getDBGlobal(ctx, 'footer', version),
    ])

    return {
      header: header ? await getEntryBundle(ctx, header) : null,
      footer: footer ? await getEntryBundle(ctx, footer) : null,
    }
  },
})

export const getEntry = query({
  args: entryIdArg,
  handler: async (ctx, args) => {
    return ctx.db.get('entries', args.id)
  },
})

export const ensureGlobal = mutation({
  args: {
    ...slugArg,
    ...versionArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const version =
      (await getCurrentVersion(ctx, args.version)) ??
      (await ensureInitialVersion(ctx))
    return await ensureDBGlobal(ctx, args.slug, version)
  },
})

export const addCollection = mutation({
  args: {
    ...collectionSlugAndNameArgs,
    ...versionArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const version =
      (await getCurrentVersion(ctx, args.version)) ??
      (await ensureInitialVersion(ctx))
    return await addDBCollection(ctx, args.slug, args.name, version)
  },
})

export const updateEntryName = mutation({
  args: {
    ...entryIdArg,
    ...entryNameArgs,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await ctx.db.patch(args.id, {
      name: args.name,
      modificationTime: Date.now(),
    })
  },
})

export const updateEntryModificationTime = mutation({
  args: {
    ...entryIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await ctx.db.patch(args.id, { modificationTime: Date.now() })
  },
})

export const deleteEntry = mutation({
  args: {
    ...entryIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await ctx.db.delete(args.id)
  },
})

export const updateEntry = mutation({
  args: {
    ...entryIdArg,
    ...entryFields,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await ctx.db.replace(args.id, {
      slug: args.slug,
      name: args.name,
      modificationTime: Date.now(),
      version: args.version,
    })
  },
})

export const getSection = query({
  args: sectionIdArg,
  handler: async (ctx, args) => {
    const section = await ctx.db.get('sections', args.id)
    return hydrateSection(ctx, validateSection(section))
  },
})

export const getSections = query({
  args: entryIdArg,
  handler: async (ctx, args) => {
    return hydrateSections(ctx, await getDBSections(ctx, args.id))
  },
})

export const getGlobalSections = query({
  args: {
    ...slugArg,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return null
    const global = await getDBGlobal(ctx, args.slug, version)
    if (!global) return null

    return hydrateSections(ctx, await getDBSections(ctx, global._id))
  },
})

export const getCollectionSections = query({
  args: {
    ...collectionSlugAndNameArgs,
    ...versionArg,
  },
  handler: async (ctx, args) => {
    const version = await getCurrentVersion(ctx, args.version)
    if (!version) return null
    const collection = await getDBCollection(ctx, args.slug, args.name, version)
    if (!collection) return null

    return hydrateSections(ctx, await getDBSections(ctx, collection._id))
  },
})

export const addSection = mutation({
  args: {
    ...sectionFields,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await assertSectionAllowedForEntry(ctx, args.entry, args.name)
    const { mcpToken, ...section } = args
    void mcpToken
    const sectionId = await addDBSection(ctx, section)
    await touchEntry(ctx, section.entry)
    return sectionId
  },
})

export const updateSection = mutation({
  args: {
    ...sectionIdArg,
    ...sectionFields,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const { id, mcpToken, ...section } = args
    void mcpToken
    await assertSectionAllowedForEntry(ctx, section.entry, section.name)
    await ctx.db.replace(id, validateSectionForStorage(section))
    await touchEntry(ctx, section.entry)
  },
})

export const reorderSections = mutation({
  args: {
    sections: v.array(reorderSectionValidator),
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const { sections } = args
    const entryIds = new Set<Id<'entries'>>()
    for (const section of sections) {
      const existing = await ctx.db.get(section.id)
      if (!existing) throw new Error('Section not found.')
      await ctx.db.patch(section.id, { pos: section.pos })
      entryIds.add(existing.entry)
    }

    for (const entryId of entryIds) {
      await touchEntry(ctx, entryId)
    }
  },
})

export const duplicateSection = mutation({
  args: {
    ...sectionIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const section = await ctx.db.get(args.id)
    if (!section) throw new Error('Section not found.')

    await assertSectionAllowedForEntry(ctx, section.entry, section.name)

    const sections = (await getDBSections(ctx, section.entry)).filter(
      (item) => item !== null,
    )
    const sectionIndex = sections.findIndex((item) => item._id === section._id)
    if (sectionIndex < 0) throw new Error('Section not found.')

    for (const [index, item] of sections.entries()) {
      const posIndex = index <= sectionIndex ? index + 1 : index + 2
      await ctx.db.patch(item._id, { pos: BigInt(posIndex * 100) })
    }

    const sectionId = await addDBSection(ctx, {
      name: section.name,
      pos: BigInt((sectionIndex + 2) * 100),
      data: section.data,
      entry: section.entry,
    })
    await touchEntry(ctx, section.entry)

    return sectionId
  },
})

export const deleteSection = mutation({
  args: {
    ...sectionIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const section = await ctx.db.get(args.id)
    await ctx.db.delete(args.id)
    if (section) await touchEntry(ctx, section.entry)
  },
})

export const getImages = query({
  args: {
    ...optionalFilterArg,
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const filter = args.filter?.trim().toLowerCase()
    if (!filter) {
      return await ctx.db
        .query('images')
        .order('desc')
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query('images')
      .withSearchIndex('search_filter', (q) => q.search('filter', filter))
      .paginate(args.paginationOpts)
  },
})

export const getImage = query({
  args: imageIdArg,
  handler: async (ctx, args) => {
    return await ctx.db.get('images', args.id)
  },
})

export const updateImageAlt = mutation({
  args: {
    ...imageIdArg,
    alt: v.string(),
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    await ctx.db.patch(args.id, { alt: args.alt })
  },
})

export const updateImageMetadata = mutation({
  args: {
    ...imageIdArg,
    name: v.string(),
    alt: v.string(),
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const image = await ctx.db.get(args.id)
    if (!image) throw new Error('Image not found.')

    await ctx.db.patch(args.id, {
      name: args.name,
      alt: args.alt,
      filter: [args.name, args.alt, image.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    })
  },
})

const valueReferencesImage = (value: unknown, id: Id<'images'>): boolean => {
  if (Array.isArray(value)) {
    return value.some((item) => valueReferencesImage(item, id))
  }

  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>
  if (record.imageId === id) return true

  return Object.values(record).some((item) => valueReferencesImage(item, id))
}

const getImageUsageCount = async (ctx: QueryCtx, id: Id<'images'>) => {
  const sections = await ctx.db.query('sections').take(1000)

  return sections.reduce((count, section) => {
    try {
      const data = JSON.parse(section.data) as unknown
      return valueReferencesImage(data, id) ? count + 1 : count
    } catch {
      return count
    }
  }, 0)
}

export const getImageUsage = query({
  args: {
    ...imageIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeUser(ctx, args.mcpToken)
    return { count: await getImageUsageCount(ctx, args.id) }
  },
})

export const deleteImage = mutation({
  args: {
    ...imageIdArg,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const image = await ctx.db.get(args.id)
    if (!image) return { deleted: false }

    const usageCount = await getImageUsageCount(ctx, args.id)
    if (usageCount > 0) {
      throw new Error('Image is used by content and cannot be deleted.')
    }

    await ctx.storage.delete(image.storageId)
    await ctx.db.delete(args.id)

    return { deleted: true }
  },
})

export const addImage = mutation({
  args: {
    ...imageFields,
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const { mcpToken, ...image } = args
    void mcpToken
    return await ctx.db.insert('images', image)
  },
})

export const generateImageUploadUrl = mutation({
  args: mcpTokenArg,
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    return await ctx.storage.generateUploadUrl()
  },
})

export const getUploadedImageUrl = query({
  args: {
    storageId: v.id('_storage'),
    ...mcpTokenArg,
  },
  handler: async (ctx, args) => {
    await requireHeadcodeUser(ctx, args.mcpToken)
    return await ctx.storage.getUrl(args.storageId)
  },
})

export const addUploadedImage = mutation({
  args: {
    ...mcpTokenArg,
    storageId: v.id('_storage'),
    alt: v.string(),
    width: v.int64(),
    height: v.int64(),
    blurDataURL: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.int64(),
    filter: v.string(),
  },
  handler: async (ctx, args) => {
    await requireHeadcodeWrite(ctx, args.mcpToken)
    const src = await ctx.storage.getUrl(args.storageId)
    if (!src) throw new Error('Uploaded image is not available.')

    const image = {
      storageId: args.storageId,
      src,
      alt: args.alt,
      width: args.width,
      height: args.height,
      blurDataURL: args.blurDataURL,
      name: args.name,
      type: args.type,
      size: args.size,
      filter: args.filter,
    }
    const id = await ctx.db.insert('images', image)

    return { _id: id, ...image }
  },
})

export const publish = mutation({
  args: mcpTokenArg,
  handler: async (ctx, args) => {
    await requireHeadcodePublish(ctx, args.mcpToken)
    const liveVersion =
      (await getCurrentVersion(ctx, 'live')) ??
      (await ensureInitialVersion(ctx))
    const draftVersion = (await getCurrentVersion(ctx, 'draft')) ?? liveVersion

    if (!draftVersion) throw new Error('No draft version available.')

    if (liveVersion && liveVersion !== draftVersion) {
      await ctx.db.patch(liveVersion, { live: false })
    }

    await ctx.db.patch(draftVersion, { live: true })

    return await newDBDraft(ctx)
  },
})

export const restoreLiveVersion = mutation({
  args: versionIdArg,
  handler: async (ctx, args) => {
    await requireHeadcodePublish(ctx)
    return await restoreDBLiveVersion(ctx, args.versionId)
  },
})

export const deleteVersion = mutation({
  args: versionIdArg,
  handler: async (ctx, args) => {
    await requireHeadcodePublish(ctx)
    return await deleteDBVersion(ctx, args.versionId)
  },
})

export const newDraft = mutation({
  args: mcpTokenArg,
  handler: async (ctx, args) => {
    await requireHeadcodePublish(ctx, args.mcpToken)
    return await newDBDraft(ctx)
  },
})
