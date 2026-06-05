import { Infer, v } from 'convex/values'

export const versionFields = {
  live: v.boolean(),
  draft: v.boolean(),
  prepare: v.boolean(),
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

export const sectionValidator = v.object(sectionFields)
export const entryValidator = v.object(entryFields)
export const imageValidator = v.object(imageFields)
export const versionValidator = v.object(versionFields)

export const entryIdArg = {
  id: v.id('entries'),
}

export const sectionIdArg = {
  id: v.id('sections'),
}

export const imageIdArg = {
  id: v.id('images'),
}

export const versionIdArg = {
  versionId: v.id('versions'),
}

export const versionArg = {
  version: headcodeVersionValidator,
}

export const slugArg = {
  slug: v.string(),
}

export const collectionSlugAndNameArgs = {
  slug: v.string(),
  name: v.string(),
}

export const optionalSlugWithVersionArgs = {
  slug: v.optional(v.string()),
  version: headcodeVersionValidator,
}

export const entryNameArgs = {
  name: v.string(),
}

export const optionalFilterArg = {
  filter: v.optional(v.string()),
}

export const mcpTokenArg = {
  mcpToken: v.optional(v.string()),
}

export const reorderSectionValidator = v.object({
  id: v.id('sections'),
  pos: v.int64(),
})

export type EntryInput = Infer<typeof entryValidator>
export type SectionInput = Infer<typeof sectionValidator>
export type ImageInput = Infer<typeof imageValidator>
export type VersionInput = Infer<typeof versionValidator>
export type HeadcodeVersionInput = Infer<typeof headcodeVersionValidator>
export type ReorderSectionInput = Infer<typeof reorderSectionValidator>
