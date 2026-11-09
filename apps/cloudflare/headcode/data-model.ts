import type * as schema from './schema'

// Convex-style document types, so admin and MCP code keeps its signatures.
type Tables = {
  versions: schema.Version
  entries: schema.Entry
  sections: schema.Section
  images: schema.Image
}
export type TableName = keyof Tables | '_storage'
export type Id<T extends TableName> = string & { __table?: T }
export type Doc<T extends keyof Tables> = Tables[T]
