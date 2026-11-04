import { defineSchema, defineTable } from 'convex/server'
import {
  entryFields,
  imageFields,
  sectionFields,
  versionFields,
} from './schema_validators'

export default defineSchema({
  versions: defineTable(versionFields)
    .index('by_live', ['live'])
    .index('by_draft', ['draft']),

  entries: defineTable(entryFields)
    .index('by_version', ['version'])
    .index('by_slug', ['slug', 'version'])
    .index('by_slug_and_name', ['slug', 'name', 'version']),

  sections: defineTable(sectionFields).index('by_entry', ['entry']),

  images: defineTable(imageFields).searchIndex('search_filter', {
    searchField: 'filter',
  }),
})
