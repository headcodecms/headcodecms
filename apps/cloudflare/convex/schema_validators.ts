import { type Infer, type ObjectType, v } from 'convex/values'

export const versionFields = {
  live: v.boolean(),
  draft: v.boolean(),
}

export const headcodeVersionValidator = v.union(
  v.literal('live'),
  v.literal('draft'),
)

export const entryFields = {
  slug: v.string(),
  name: v.union(v.string(), v.null()),
  modificationTime: v.number(),
  version: v.id('versions'),
}

export const sectionFields = {
  name: v.string(),
  pos: v.int64(),
  data: v.string(),
  entry: v.id('entries'),
}

export const imageFields = {
  storageId: v.id('_storage'),
  src: v.string(),
  alt: v.string(),
  width: v.int64(),
  height: v.int64(),
  blurDataURL: v.string(),
  name: v.string(),
  type: v.string(),
  size: v.int64(),
  filter: v.string(),
}

export const versionArg = { version: headcodeVersionValidator }
export const mcpTokenArg = { mcpToken: v.optional(v.string()) }

export type SectionInput = ObjectType<typeof sectionFields>
export type HeadcodeVersionInput = Infer<typeof headcodeVersionValidator>
