import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  like,
  sql,
} from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'

import { type Auth, requireHeadcodeUser } from './authorization'
import { headcodeConfig } from './config'
import { deleteStoredImage, imageSrc } from './images'
import * as schema from './schema'
import {
  getSectionConfig,
  isRecord,
  validateSection,
  validateSectionForStorage,
} from './section_validations'
import type {
  HeadcodeFieldConfig,
  HeadcodeVersion,
  ServiceSection,
} from './types'
import { slugifyPath } from './utils'

// Service boundary for site, admin, and MCP (same functions as the Convex
// version). Admin reads require a signed-in user, writes an editor or the
// shared MCP bearer token (authorization.ts).

const { versions, entries, sections, images, uploads } = schema

export type Db = BaseSQLiteDatabase<'async', unknown, typeof schema>
export type Ctx = { db: Db; auth: Auth }

type Access = 'public' | 'user' | 'editor'
type Service<Kind, Args, Result> = {
  kind: Kind
  access: Access
  handler: (ctx: Ctx, args: Args) => Promise<Result>
}

const query = <Args = Record<string, never>, Result = unknown>(
  handler: (ctx: Ctx, args: Args) => Promise<Result>,
): Service<'query', Args, Result> => ({
  kind: 'query',
  access: 'public',
  handler,
})
const adminQuery = <Args = Record<string, never>, Result = unknown>(
  handler: (ctx: Ctx, args: Args) => Promise<Result>,
): Service<'query', Args, Result> => ({
  kind: 'query',
  access: 'user',
  handler,
})
const adminMutation = <Args = Record<string, never>, Result = unknown>(
  handler: (ctx: Ctx, args: Args) => Promise<Result>,
): Service<'mutation', Args, Result> => ({
  kind: 'mutation',
  access: 'editor',
  handler,
})

type Int = number | bigint
const first = async <T>(rows: Promise<T[]>) => (await rows)[0] ?? null

// Writes that belong together run as one batch: D1 and libSQL execute a
// batch as a single transaction, so it applies completely or not at all.
type Statement = unknown
const commit = async (db: Db, statements: Statement[]) => {
  if (statements.length)
    await (
      db as unknown as { batch: (s: Statement[]) => Promise<unknown> }
    ).batch(statements)
}

// Insert statements in chunks: D1 allows at most 100 bound parameters each.
const insertRows = <T extends SQLiteTable>(
  db: Db,
  table: T,
  rows: T['$inferInsert'][],
): Statement[] => {
  if (!rows.length) return []
  // Every column is bound, also the ones with defaults (_id, _creationTime).
  const size = Math.max(
    1,
    Math.floor(99 / Object.keys(getTableColumns(table)).length),
  )
  const statements: Statement[] = []
  for (let i = 0; i < rows.length; i += size)
    statements.push(db.insert(table).values(rows.slice(i, i + size)))
  return statements
}

const globalSlugs: string[] = headcodeConfig.globals.map((item) => item.slug)
const collectionSlugs: string[] = headcodeConfig.collections.map(
  (item) => item.slug,
)
type EntryConfig =
  | (typeof headcodeConfig.globals)[number]
  | (typeof headcodeConfig.collections)[number]

// Versions

const findVersion = async (db: Db, version: HeadcodeVersion) => {
  const found = await db
    .select()
    .from(versions)
    .where(eq(versions[version], true))
    .limit(2)
  if (found.length > 1) throw new Error(`Multiple ${version} versions found.`)
  return found[0] ?? null
}

// Returns null only for an empty install; reads never create versions.
export const getVersionId = async (db: Db, version: HeadcodeVersion) => {
  const found = await findVersion(db, version)
  if (found) return found._id
  if (await first(db.select().from(versions).limit(1)))
    throw new Error(`No ${version} version found.`)
  return null
}

const insertVersion = async (
  db: Db,
  flags: { live: boolean; draft: boolean },
) => (await db.insert(versions).values(flags).returning())[0]._id

// The first write creates one version that is both live and draft.
export const ensureVersionId = async (db: Db, version: HeadcodeVersion) =>
  (await getVersionId(db, version)) ??
  (await insertVersion(db, { live: true, draft: true }))

// Statements that copy a version (entries and sections) into a new one.
const cloneStatements = async (
  db: Db,
  source: string,
  version: string,
  flags: { live: boolean; draft: boolean },
) => {
  const sourceEntries = await getEntries(db, source)
  const ids = new Map(
    sourceEntries.map((entry) => [entry._id, crypto.randomUUID()]),
  )
  const sourceSections = await db
    .select({ section: sections })
    .from(sections)
    .innerJoin(entries, eq(entries._id, sections.entry))
    .where(eq(entries.version, source))
  return [
    db.insert(versions).values({ _id: version, ...flags }),
    ...insertRows(
      db,
      entries,
      sourceEntries.map((entry) => ({
        _id: ids.get(entry._id),
        slug: entry.slug,
        name: entry.name,
        modificationTime: Date.now(),
        version,
      })),
    ),
    ...insertRows(
      db,
      sections,
      sourceSections.map(({ section: { name, pos, data, entry } }) => ({
        name,
        pos,
        data,
        entry: ids.get(entry)!,
      })),
    ),
  ]
}

// The old draft stops being the draft and a copy of live becomes the new one.
const newDraftVersion = async (db: Db) => {
  const live = await ensureVersionId(db, 'live')
  const oldDraft = await findVersion(db, 'draft')
  const version = crypto.randomUUID()
  await commit(db, [
    ...(oldDraft
      ? [
          db
            .update(versions)
            .set({ draft: false })
            .where(eq(versions._id, oldDraft._id)),
        ]
      : []),
    ...(await cloneStatements(db, live, version, { live: false, draft: true })),
  ])
  return version
}

const getVersion = (db: Db, id: string) =>
  first(db.select().from(versions).where(eq(versions._id, id)))

const entryIdsOfVersion = (db: Db, version: string) =>
  db
    .select({ id: entries._id })
    .from(entries)
    .where(eq(entries.version, version))

// Entries

const getEntries = (db: Db, version: string) =>
  db.select().from(entries).where(eq(entries.version, version)).limit(1000)

const getEntryById = (db: Db, id: string) =>
  first(db.select().from(entries).where(eq(entries._id, id)))

const unique = async <T>(rows: Promise<T[]>) => {
  const found = await rows
  if (found.length > 1) throw new Error('Expected a unique result.')
  return found[0] ?? null
}

const getGlobal = (db: Db, slug: string, version: string) =>
  globalSlugs.includes(slug)
    ? unique(
        db
          .select()
          .from(entries)
          .where(and(eq(entries.slug, slug), eq(entries.version, version)))
          .limit(2),
      )
    : null

const getCollections = async (
  db: Db,
  slug: string | undefined,
  version: string,
) => {
  if (!slug)
    return (await getEntries(db, version)).filter((entry) =>
      collectionSlugs.includes(entry.slug),
    )
  if (!collectionSlugs.includes(slug)) return []
  return db
    .select()
    .from(entries)
    .where(and(eq(entries.slug, slug), eq(entries.version, version)))
    .limit(1000)
}

// Finds a collection entry by exact name or by its URL slug.
const getCollection = async (
  db: Db,
  slug: string,
  nameOrSlug: string,
  version: string,
) => {
  if (!collectionSlugs.includes(slug)) return null
  const exact = await unique(
    db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.slug, slug),
          eq(entries.name, nameOrSlug),
          eq(entries.version, version),
        ),
      )
      .limit(2),
  )
  if (exact) return exact
  return (
    (await getCollections(db, slug, version)).find(
      (entry) => entry.name !== null && slugifyPath(entry.name) === nameOrSlug,
    ) ?? null
  )
}

export const getEntryConfig = (entry: { slug: string; name: string | null }) =>
  (
    (entry.name === null
      ? headcodeConfig.globals
      : headcodeConfig.collections) as EntryConfig[]
  ).find((config) => config.slug === entry.slug) ?? null

// Creates an entry with the given sections, or the configured defaults.
const createEntry = async (
  db: Db,
  entry: { slug: string; name: string | null },
  version: string,
  entrySections?: readonly { name: string; data: unknown }[],
) => {
  const config = getEntryConfig(entry)
  const kind = entry.name === null ? 'global' : 'collection'
  if (!config) throw new Error(`Unknown ${kind} "${entry.slug}".`)

  const _id = crypto.randomUUID()
  await commit(db, [
    db
      .insert(entries)
      .values({ ...entry, _id, modificationTime: Date.now(), version }),
    ...insertRows(
      db,
      sections,
      (entrySections ?? config.defaults).map((section, index) =>
        validateSectionForStorage({
          name: section.name,
          pos: index,
          data: JSON.stringify(section.data),
          entry: _id,
        }),
      ),
    ),
  ])
  return _id
}

// Sections

type SectionInput = { name: string; pos: Int; data: string; entry: string }

const getSortedSections = async (db: Db, entry: string) =>
  (
    await db
      .select()
      .from(sections)
      .where(eq(sections.entry, entry))
      .orderBy(asc(sections.pos))
      .limit(1000)
  ).map(validateSection)

const getSectionById = (db: Db, id: string) =>
  first(db.select().from(sections).where(eq(sections._id, id)))

// A section insert with a known id (for a batch).
const insertSection = (db: Db, section: SectionInput & { _id: string }) =>
  db
    .insert(sections)
    .values(validateSectionForStorage({ ...section, pos: Number(section.pos) }))

const touchEntry = (db: Db, entry: string) =>
  db
    .update(entries)
    .set({ modificationTime: Date.now() })
    .where(eq(entries._id, entry))

const assertSectionAllowed = async (
  db: Db,
  entryId: string,
  sectionName: string,
) => {
  getSectionConfig(sectionName)
  const entry = await getEntryById(db, entryId)
  if (!entry) throw new Error('Entry not found.')
  const config = getEntryConfig(entry)
  if (!config) throw new Error(`Entry "${entry.slug}" is not configured.`)
  if (!config.sections.some((section) => section.name === sectionName))
    throw new Error(
      `Section "${sectionName}" is not configured for entry "${entry.slug}".`,
    )
}

// Image fields store { imageId }; reads replace them with the image record.
const getImageById = (db: Db, id: string) =>
  first(db.select().from(images).where(eq(images._id, id)))

const hydrate = async (
  db: Db,
  fields: Record<string, HeadcodeFieldConfig>,
  data: unknown,
): Promise<unknown> => {
  if (!isRecord(data)) return data
  const hydrateField = async (field: HeadcodeFieldConfig, value: unknown) => {
    if (Array.isArray(field))
      return Array.isArray(value)
        ? Promise.all(value.map((item) => hydrate(db, field[0] ?? {}, item)))
        : []
    if (
      field.type !== 'image' ||
      !isRecord(value) ||
      typeof value.imageId !== 'string'
    )
      return value
    return getImageById(db, value.imageId)
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
  db: Db,
  section: ServiceSection,
): Promise<ServiceSection> => ({
  ...section,
  data: await hydrate(db, getSectionConfig(section.name).fields, section.data),
})

const hydrateSections = (db: Db, list: ServiceSection[]) =>
  Promise.all(list.map((section) => hydrateSection(db, section)))

const getEntryBundle = async (db: Db, entry: schema.Entry) => ({
  entry,
  sections: await hydrateSections(db, await getSortedSections(db, entry._id)),
})

// Images

const imageFilter = (...values: string[]) =>
  values.filter(Boolean).join(' ').toLowerCase()

const referencesImage = (value: unknown, id: string): boolean =>
  Array.isArray(value)
    ? value.some((item) => referencesImage(item, id))
    : isRecord(value) &&
      (value.imageId === id ||
        Object.values(value).some((item) => referencesImage(item, id)))

// Counts sections (across all versions) that reference the image.
const countImageUsage = async (db: Db, id: string) =>
  (
    await db
      .select({ data: sections.data })
      .from(sections)
      .where(like(sections.data, `%${id}%`))
      .limit(1000)
  ).filter((section) => {
    try {
      return referencesImage(JSON.parse(section.data), id)
    } catch {
      return false
    }
  }).length

type ImageInput = {
  storageId: string
  alt: string
  width: Int
  height: Int
  blurDataURL: string
  name: string
  type: string
  size: Int
}

export const services = {
  // Versions

  getVersionStatus: query(async ({ db }) => {
    const all = await db.select().from(versions).limit(1000)
    const live = all.find((version) => version.live) ?? null
    const draft = all.find((version) => version.draft) ?? null
    const shared = Boolean(live && draft && live._id === draft._id)
    return {
      live,
      draft,
      shared,
      canPublish: Boolean(live && draft && !shared),
      canNewDraft: Boolean(live && (!draft || shared)),
    }
  }),

  getVersionHistory: adminQuery(async ({ db }) =>
    db
      .select()
      .from(versions)
      .orderBy(desc(versions._creationTime), desc(sql`rowid`))
      .limit(1000),
  ),

  publish: adminMutation(async ({ db }) => {
    const live = await ensureVersionId(db, 'live')
    const draft = (await getVersionId(db, 'draft')) ?? live
    // The draft becomes live, and a copy of it becomes the new draft.
    const version = crypto.randomUUID()
    await commit(db, [
      ...(live !== draft
        ? [
            db
              .update(versions)
              .set({ live: false })
              .where(eq(versions._id, live)),
          ]
        : []),
      db
        .update(versions)
        .set({ live: true, draft: false })
        .where(eq(versions._id, draft)),
      ...(await cloneStatements(db, draft, version, {
        live: false,
        draft: true,
      })),
    ])
    return version
  }),

  newDraft: adminMutation(async ({ db }) => newDraftVersion(db)),

  restoreLiveVersion: adminMutation(
    async ({ db }, { versionId }: { versionId: string }) => {
      const source = await getVersion(db, versionId)
      if (!source) throw new Error('Version not found.')
      if (source.live) throw new Error('Version is already live.')
      const oldLive = await findVersion(db, 'live')
      const version = crypto.randomUUID()
      await commit(db, [
        ...(oldLive
          ? [
              db
                .update(versions)
                .set({ live: false })
                .where(eq(versions._id, oldLive._id)),
            ]
          : []),
        ...(await cloneStatements(db, versionId, version, {
          live: true,
          draft: false,
        })),
      ])
      return version
    },
  ),

  deleteVersion: adminMutation(
    async ({ db }, { versionId }: { versionId: string }) => {
      const version = await getVersion(db, versionId)
      if (!version) throw new Error('Version not found.')
      if (version.live || version.draft)
        throw new Error('Live and draft versions cannot be deleted.')
      const entryIds = entryIdsOfVersion(db, versionId)
      const [{ count: sectionCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sections)
        .where(inArray(sections.entry, entryIds))
      const [{ count: entryCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(entries)
        .where(eq(entries.version, versionId))
      await commit(db, [
        db.delete(sections).where(inArray(sections.entry, entryIds)),
        db.delete(entries).where(eq(entries.version, versionId)),
        db.delete(versions).where(eq(versions._id, versionId)),
      ])
      return { deleted: true, entries: entryCount, sections: sectionCount }
    },
  ),

  // Entries

  getAll: query(async ({ db }, args: { version: HeadcodeVersion }) => {
    const version = await getVersionId(db, args.version)
    if (!version) return { globals: [], collections: [] }
    const all = await getEntries(db, version)
    return {
      globals: all.filter((entry) => globalSlugs.includes(entry.slug)),
      collections: all.filter((entry) => collectionSlugs.includes(entry.slug)),
    }
  }),

  getGlobalWithSections: query(
    async ({ db }, args: { slug: string; version: HeadcodeVersion }) => {
      const version = await getVersionId(db, args.version)
      const global = version && (await getGlobal(db, args.slug, version))
      return global ? getEntryBundle(db, global) : null
    },
  ),

  getCollectionWithSections: query(
    async (
      { db },
      args: { slug: string; name: string; version: HeadcodeVersion },
    ) => {
      const version = await getVersionId(db, args.version)
      const entry =
        version && (await getCollection(db, args.slug, args.name, version))
      return entry ? getEntryBundle(db, entry) : null
    },
  ),

  getCollectionsWithSections: query(
    async ({ db }, args: { slug?: string; version: HeadcodeVersion }) => {
      const version = await getVersionId(db, args.version)
      if (!version) return []
      const list = await getCollections(db, args.slug, version)
      return Promise.all(list.map((entry) => getEntryBundle(db, entry)))
    },
  ),

  getSiteChrome: query(async ({ db }, args: { version: HeadcodeVersion }) => {
    const version = await getVersionId(db, args.version)
    const bundle = async (slug: string) => {
      const global = version && (await getGlobal(db, slug, version))
      return global ? getEntryBundle(db, global) : null
    }
    const [header, footer] = await Promise.all([
      bundle('header'),
      bundle('footer'),
    ])
    return { header, footer }
  }),

  getEntry: query(async ({ db }, args: { id: string }) =>
    getEntryById(db, args.id),
  ),

  addCollection: adminMutation(
    async (
      { db },
      {
        slug,
        name,
        version,
      }: { slug: string; name: string; version: HeadcodeVersion },
    ) => {
      const versionId = await ensureVersionId(db, version)
      if (await getCollection(db, slug, name, versionId))
        throw new Error(`Collection entry "${slug}/${name}" already exists.`)
      return createEntry(db, { slug, name }, versionId)
    },
  ),

  updateEntryName: adminMutation(
    async ({ db }, { id, name }: { id: string; name: string }) => {
      await db
        .update(entries)
        .set({ name, modificationTime: Date.now() })
        .where(eq(entries._id, id))
      return null
    },
  ),

  deleteEntry: adminMutation(async ({ db }, { id }: { id: string }) => {
    await commit(db, [
      db.delete(sections).where(eq(sections.entry, id)),
      db.delete(entries).where(eq(entries._id, id)),
    ])
    return null
  }),

  // Sections

  getSection: query(async ({ db }, args: { id: string }) => {
    const section = validateSection(await getSectionById(db, args.id))
    return section && hydrateSection(db, section)
  }),

  getSections: query(async ({ db }, args: { id: string }) =>
    hydrateSections(db, await getSortedSections(db, args.id)),
  ),

  addSection: adminMutation(async ({ db }, section: SectionInput) => {
    await assertSectionAllowed(db, section.entry, section.name)
    const id = crypto.randomUUID()
    await commit(db, [
      insertSection(db, { ...section, _id: id }),
      touchEntry(db, section.entry),
    ])
    return id
  }),

  updateSection: adminMutation(
    async ({ db }, { id, ...section }: SectionInput & { id: string }) => {
      await assertSectionAllowed(db, section.entry, section.name)
      await commit(db, [
        db
          .update(sections)
          .set(
            validateSectionForStorage({ ...section, pos: Number(section.pos) }),
          )
          .where(eq(sections._id, id)),
        touchEntry(db, section.entry),
      ])
      return null
    },
  ),

  reorderSections: adminMutation(
    async (
      { db },
      { sections: order }: { sections: { id: string; pos: Int }[] },
    ) => {
      const touched = new Set<string>()
      const statements: Statement[] = []
      for (const { id, pos } of order) {
        const existing = await getSectionById(db, id)
        if (!existing) throw new Error('Section not found.')
        statements.push(
          db
            .update(sections)
            .set({ pos: Number(pos) })
            .where(eq(sections._id, id)),
        )
        touched.add(existing.entry)
      }
      for (const entry of touched) statements.push(touchEntry(db, entry))
      await commit(db, statements)
      return null
    },
  ),

  // Inserts a copy right after the original and renumbers positions in steps of 100.
  duplicateSection: adminMutation(async ({ db }, { id }: { id: string }) => {
    const section = await getSectionById(db, id)
    if (!section) throw new Error('Section not found.')
    await assertSectionAllowed(db, section.entry, section.name)

    const list = await getSortedSections(db, section.entry)
    const index = list.findIndex((item) => item._id === id)
    const copyId = crypto.randomUUID()
    await commit(db, [
      ...list.map((item, i) =>
        db
          .update(sections)
          .set({ pos: (i <= index ? i + 1 : i + 2) * 100 })
          .where(eq(sections._id, item._id)),
      ),
      insertSection(db, {
        _id: copyId,
        name: section.name,
        pos: (index + 2) * 100,
        data: section.data,
        entry: section.entry,
      }),
      touchEntry(db, section.entry),
    ])
    return copyId
  }),

  deleteSection: adminMutation(async ({ db }, { id }: { id: string }) => {
    const section = await getSectionById(db, id)
    await commit(db, [
      db.delete(sections).where(eq(sections._id, id)),
      ...(section ? [touchEntry(db, section.entry)] : []),
    ])
    return null
  }),

  // Images

  getImages: query(
    async (
      { db },
      args: {
        filter?: string
        paginationOpts: { numItems: number; cursor: string | null }
      },
    ) => {
      const filter = args.filter?.trim().toLowerCase()
      const offset = Number(args.paginationOpts.cursor ?? 0) || 0
      const limit = args.paginationOpts.numItems
      const rows = await db
        .select()
        .from(images)
        .where(filter ? like(images.filter, `%${filter}%`) : undefined)
        .orderBy(desc(images._creationTime), desc(sql`rowid`))
        .limit(limit + 1)
        .offset(offset)
      return {
        page: rows.slice(0, limit),
        isDone: rows.length <= limit,
        continueCursor: String(offset + Math.min(rows.length, limit)),
      }
    },
  ),

  getImage: query(async ({ db }, args: { id: string }) =>
    getImageById(db, args.id),
  ),

  updateImageMetadata: adminMutation(
    async (
      { db },
      { id, name, alt }: { id: string; name: string; alt: string },
    ) => {
      const image = await getImageById(db, id)
      if (!image) throw new Error('Image not found.')
      await db
        .update(images)
        .set({ name, alt, filter: imageFilter(name, alt, image.type) })
        .where(eq(images._id, id))
      return null
    },
  ),

  getImageUsage: adminQuery(async ({ db }, { id }: { id: string }) => ({
    count: await countImageUsage(db, id),
  })),

  deleteImage: adminMutation(async ({ db }, { id }: { id: string }) => {
    const image = await getImageById(db, id)
    if (!image) return { deleted: false }
    if ((await countImageUsage(db, id)) > 0)
      throw new Error('Image is used by content and cannot be deleted.')
    await deleteStoredImage(image.storageId)
    await db.delete(images).where(eq(images._id, id))
    return { deleted: true }
  }),

  // A one-time upload URL (relative), valid for one hour; see app/media/upload.
  generateImageUploadUrl: adminMutation(async ({ db }) => {
    const [{ _id }] = await db
      .insert(uploads)
      .values({ expiresAt: Date.now() + 60 * 60 * 1000 })
      .returning()
    return `/media/upload/${_id}`
  }),

  getUploadedImageUrl: adminQuery(
    async (_ctx, { storageId }: { storageId: string }) => imageSrc(storageId),
  ),

  addUploadedImage: adminMutation(async ({ db }, args: ImageInput) => {
    const image = {
      ...args,
      width: Number(args.width),
      height: Number(args.height),
      size: Number(args.size),
      src: imageSrc(args.storageId),
      filter: imageFilter(args.name, args.alt, args.type),
    }
    const [saved] = await db.insert(images).values(image).returning()
    return saved
  }),
}

export type Services = typeof services
export type ServiceName = keyof Services

// Runs a service with its access check; `mcpToken` may come with the args.
export const callService = async (
  db: Db,
  name: string,
  args: Record<string, unknown> | undefined,
  auth: Auth,
) => {
  const service = (services as Record<string, Service<string, never, unknown>>)[
    name
  ]
  if (!service) throw new Error(`Unknown service "${name}".`)
  const { mcpToken, ...rest } = args ?? {}
  const ctxAuth = {
    ...auth,
    mcpToken: typeof mcpToken === 'string' ? mcpToken : auth.mcpToken,
  }
  if (service.access !== 'public')
    requireHeadcodeUser(ctxAuth, service.access === 'editor')
  return {
    kind: service.kind,
    result: await service.handler({ db, auth: ctxAuth }, rest as never),
  }
}

// Consumes a one-time upload ticket (app/media/upload/[ticket]/route.ts).
export const consumeUpload = async (db: Db, ticket: string) => {
  const [found] = await db
    .delete(uploads)
    .where(eq(uploads._id, ticket))
    .returning()
  return Boolean(found && found.expiresAt > Date.now())
}

type SeedEntry = {
  name: string
  sections: readonly { name: string; data: unknown }[]
}

// Fills the database from headcode/config.ts (`pnpm seed`, safe to repeat):
// - an empty install gets one version (live and draft shared) and the
//   collection's `seed` entries, or one sample entry built from its defaults,
// - every run adds configured globals that are missing in live or draft.
export const seed = async (db: Db) => {
  const empty = !(await first(db.select().from(versions).limit(1)))
  const live = await ensureVersionId(db, 'live')
  const draft = await ensureVersionId(db, 'draft')

  for (const version of new Set([live, draft])) {
    for (const { slug } of headcodeConfig.globals)
      if (!(await getGlobal(db, slug, version)))
        await createEntry(db, { slug, name: null }, version)
    if (!empty) continue
    for (const config of headcodeConfig.collections) {
      const { slug, defaults } = config
      const seedEntries = (config as { seed?: readonly SeedEntry[] }).seed ?? []
      for (const { name, sections: entrySections } of seedEntries)
        await createEntry(db, { slug, name }, version, entrySections)
      if (seedEntries.length) continue
      const meta = defaults.find(
        (section) => section.name === 'meta' || section.name === 'blog-meta',
      )?.data as { title?: string } | undefined
      await createEntry(db, { slug, name: meta?.title ?? slug }, version)
    }
  }
}
