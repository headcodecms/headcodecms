import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Same document shape as the Convex version: `_id`, `_creationTime`, and
// references by id (`version`, `entry`), so site, admin, and MCP keep working.
const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())
const creationTime = () =>
  integer('creation_time')
    .notNull()
    .$defaultFn(() => Date.now())

export const versions = sqliteTable(
  'versions',
  {
    _id: id(),
    _creationTime: creationTime(),
    live: integer('live', { mode: 'boolean' }).notNull(),
    draft: integer('draft', { mode: 'boolean' }).notNull(),
  },
  (table) => [
    index('versions_live').on(table.live),
    index('versions_draft').on(table.draft),
  ],
)

export const entries = sqliteTable(
  'entries',
  {
    _id: id(),
    _creationTime: creationTime(),
    slug: text('slug').notNull(),
    name: text('name'),
    modificationTime: integer('modification_time').notNull(),
    version: text('version_id')
      .notNull()
      .references(() => versions._id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('entries_version').on(table.version),
    index('entries_slug').on(table.slug, table.version),
    index('entries_slug_name').on(table.slug, table.name, table.version),
  ],
)

export const sections = sqliteTable(
  'sections',
  {
    _id: id(),
    _creationTime: creationTime(),
    name: text('name').notNull(),
    pos: integer('pos').notNull(),
    data: text('data').notNull(),
    entry: text('entry_id')
      .notNull()
      .references(() => entries._id, { onDelete: 'cascade' }),
  },
  (table) => [index('sections_entry').on(table.entry)],
)

export const images = sqliteTable(
  'images',
  {
    _id: id(),
    _creationTime: creationTime(),
    storageId: text('storage_id').notNull(),
    src: text('src').notNull(),
    alt: text('alt').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    blurDataURL: text('blur_data_url').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    size: integer('size').notNull(),
    filter: text('filter').notNull(),
  },
  (table) => [index('images_creation_time').on(table._creationTime)],
)

// One-time upload tickets: generateImageUploadUrl creates one, the upload
// route consumes it (replaces Convex signed upload URLs).
export const uploads = sqliteTable('uploads', {
  _id: id(),
  expiresAt: integer('expires_at').notNull(),
})

export type Version = typeof versions.$inferSelect
export type Entry = typeof entries.$inferSelect
export type Section = typeof sections.$inferSelect
export type Image = typeof images.$inferSelect
