import type { z } from 'zod'

export type Fields = Record<string, z.ZodType>

export type InferFields<TFields extends Fields> = z.output<z.ZodObject<TFields>>

export type HeadcodeSectionConfig = {
  name: string
  label: string
  description?: string
  fields: Fields
}

// `live`, or the draft through the project's preview token (/preview/<token>).
export type HeadcodeVersion = 'live' | `preview-${string}`

// An entry as the site renders it: a global (`home`, name null) or a
// collection item (`blog/hello`: slug `blog`, name `hello`).
export type ServiceEntry = {
  _id: string
  slug: string
  name: string | null
  modificationTime: number
}

export type ServiceSection = {
  _id: string
  name: string
  pos: number
  data: unknown
}

export type ServiceEntryBundle = {
  entry: ServiceEntry
  sections: ServiceSection[]
}

export type DataHeadcode = {
  entry: {
    id: string
    slug: string
    name: string | null
    modificationTime: number
    description?: string
  }
  section: {
    id: string
    name: string
    pos: number
    description?: string
  }
}
