// Writes, from headcode/config.ts:
// - headcode.schema.json: the schema for the backend (MCP schema_push, or
//   `headcode schema <project> headcode.schema.json` locally),
// - headcode.seed.json: default entries for a fresh project (`headcode seed`):
//   every global, and one sample item per collection.
import { writeFileSync } from 'node:fs'
import { z } from 'zod'

import { headcodeConfig } from '../headcode/config.ts'
import type { HeadcodeSectionConfig } from '../headcode/types.ts'

type EntryConfig = {
  slug: string
  path?: string
  description: string
  sections: readonly HeadcodeSectionConfig[]
  defaults: readonly { name: string; data: unknown }[]
}

const globals: readonly EntryConfig[] = headcodeConfig.globals
const collections: readonly EntryConfig[] = headcodeConfig.collections

const sections: Record<string, unknown> = {}
for (const config of [...globals, ...collections])
  for (const section of config.sections)
    sections[section.name] ??= z.toJSONSchema(
      z.object(section.fields).meta({
        title: section.label,
        description: section.description,
      }),
      // Fields with a default may be left out.
      { io: 'input' },
    )

const entryType = ({ slug, path, description, sections }: EntryConfig) => ({
  slug,
  ...(path ? { path } : {}),
  description,
  sections: sections.map((section) => section.name),
})

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const sampleName = ({ slug, defaults }: EntryConfig) => {
  const meta = defaults.find(
    (section) => section.data && 'title' in (section.data as object),
  )
  return slugify(String((meta?.data as { title?: string })?.title ?? slug))
}

const write = (file: string, value: unknown) => {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
  console.log(`wrote ${file}`)
}

write('headcode.schema.json', {
  sections,
  globals: globals.map(entryType),
  collections: collections.map(entryType),
})
write('headcode.seed.json', [
  ...globals.map((config) => ({
    slug: config.slug,
    sections: config.defaults,
  })),
  ...collections.map((config) => ({
    slug: `${config.slug}/${sampleName(config)}`,
    sections: config.defaults,
  })),
])
