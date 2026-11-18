import { z } from 'zod'

// Fields are Zod schemas. `field` tells the admin which input to show; the
// label and description show in the admin and, through `pnpm schema`, to
// agents as JSON Schema `title` and `description`. Defaults fill missing data.
type FieldParams = { label?: string; description?: string }

const meta = (field: string, { label, description }: FieldParams) => ({
  field,
  title: label,
  ...(description ? { description } : {}),
})

export const TextField = (params: FieldParams = {}) =>
  z.string().default('').meta(meta('text', params))

export const TextareaField = (params: FieldParams = {}) =>
  z.string().default('').meta(meta('textarea', params))

// Markdown; the admin edits it with a rich text editor.
export const RichtextField = (params: FieldParams = {}) =>
  z.string().default('').meta(meta('richtext', params))

export const SelectField = ({
  options,
  defaultValue,
  ...params
}: FieldParams & {
  options: { label: string; value: string }[]
  defaultValue: string
}) => {
  const values = options.map((option) => option.value)
  if (!values.includes(defaultValue))
    throw new Error('SelectField defaultValue must match one of the options.')
  return z
    .enum(values as [string, ...string[]])
    .default(defaultValue)
    .meta({ ...meta('select', params), options })
}

export const LinkField = (params: FieldParams = {}) =>
  z
    .object({
      title: z.string().default('Link'),
      url: z.string().default(''),
      openInNewWindow: z.boolean().default(false),
    })
    .default({ title: 'Link', url: '', openInNewWindow: false })
    .meta(meta('link', params))

// An image from the media list (media_list): the field keeps a copy of its
// src, alt, size and blur placeholder, so the site renders it directly.
export const ImageField = (params: FieldParams = {}) =>
  z
    .object({
      src: z.string(),
      alt: z.string().default(''),
      width: z.number(),
      height: z.number(),
      blurDataURL: z.string().optional(),
    })
    .nullable()
    .default(null)
    .meta(meta('image', params))

export const CheckboxField = (params: FieldParams = {}) =>
  z.boolean().default(false).meta(meta('checkbox', params))

// Milliseconds since 1970.
export const DateTimeField = (params: FieldParams = {}) =>
  z.number().default(0).meta(meta('datetime', params))

// A reorderable list of items with the given fields.
export const ListField = <TFields extends Record<string, z.ZodType>>({
  fields,
  ...params
}: FieldParams & { fields: TFields }) =>
  z.array(z.object(fields)).default([]).meta(meta('list', params))
