import { z } from 'zod'
import { Doc, Id } from '@/convex/_generated/dataModel'

export type HeadcodeFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'select'
  | 'link'
  | 'image'
  | 'checkbox'
  | 'datetime'

type FieldDefinition = {
  type?: HeadcodeFieldType
  label?: string
  description?: string
  options?: { label: string; value: string }[]
  accept?: ImageFieldAccept
  maxSize?: number
  validator?: z.ZodType
  validation?: z.ZodType
}

export type FieldParams<TValidator extends z.ZodType = z.ZodType> = {
  label?: string
  validator?: TValidator
  [key: string]: unknown
}

export type SelectFieldParams = {
  label?: string
  description?: string
  options: { label: string; value: string }[]
  defaultValue: string
  validator?: z.ZodType<string>
}

export type ImageFieldAccept = Record<string, readonly string[]>

export type ImageFieldParams = FieldParams<z.ZodType<ImageFieldValue>> & {
  accept?: ImageFieldAccept
  maxSize?: number
}

export type LinkFieldValue = {
  title: string
  url: string
  openInNewWindow: boolean
}

export type ImageFieldValue = {
  imageId: Id<'images'>
} | null

export type HeadcodeFieldConfig =
  | FieldDefinition
  | Record<string, HeadcodeFieldConfig>[]

export type HeadcodeSectionConfig = {
  name: string
  fields: Record<string, HeadcodeFieldConfig>
}

export type HeadcodeSectionLike = {
  name: string
  data: string | Record<string, unknown>
}

type InferField<TField> = TField extends (infer TItem)[]
  ? TItem extends Record<string, HeadcodeFieldConfig>
    ? InferFields<TItem>[]
    : never[]
  : TField extends { validator: infer TValidator }
    ? TValidator extends z.ZodType
      ? z.infer<TValidator>
      : unknown
    : TField extends { validation: infer TValidator }
      ? TValidator extends z.ZodType
        ? z.infer<TValidator>
        : unknown
      : unknown

export type InferFields<TFields extends Record<string, HeadcodeFieldConfig>> = {
  [TKey in keyof TFields]: InferField<TFields[TKey]>
}

export type InferSectionData<
  TFields extends Record<string, HeadcodeFieldConfig>,
> = InferFields<TFields>

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

export type ServiceEntry = Doc<'entries'>

export type ServiceSection = Omit<Doc<'sections'>, 'data'> & {
  data: unknown
}

export type ServiceEntryBundle = {
  entry: ServiceEntry
  sections: ServiceSection[]
}

export type HeadcodeVersion = 'live' | 'draft'
export type HeadcodeVersionConfig = HeadcodeVersion | 'auto'

export type EntryId = Id<'entries'>
export type SectionId = Id<'sections'>
