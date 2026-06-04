import { z } from 'zod'
import type {
  FieldParams,
  ImageFieldParams,
  ImageFieldValue,
  LinkFieldValue,
  SelectFieldParams,
} from './types'

type StringFieldParams = FieldParams<z.ZodType<string>>
type BooleanFieldParams = FieldParams<z.ZodType<boolean>>
type NumberFieldParams = FieldParams<z.ZodType<number>>
type LinkFieldParams = FieldParams<z.ZodType<LinkFieldValue>>

export const DEFAULT_IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
} as const

export const DEFAULT_IMAGE_MAX_SIZE = 2 * 1024 * 1024

export const TextField = (params: StringFieldParams = {}) => ({
  label: 'Text Field',
  validator: z.string().default('') as z.ZodType<string>,
  ...params,
  type: 'text' as const,
})

export const TextareaField = (params: StringFieldParams = {}) => ({
  label: 'Textarea Field',
  validator: z.string().default('') as z.ZodType<string>,
  ...params,
  type: 'textarea' as const,
})

// rich text field stores markdown strings
// admin uses tiptap editor for editing
export const RichtextField = (params: StringFieldParams = {}) => ({
  label: 'Richtext Field',
  validator: z.string().default('') as z.ZodType<string>,
  ...params,
  type: 'richtext' as const,
})

export const SelectField = (params: SelectFieldParams) => {
  const { label, options, defaultValue, validator, ...fieldParams } = params
  const values = options.map((option) => option.value)

  if (values.length === 0) {
    throw new Error('SelectField requires at least one option.')
  }

  if (!values.includes(defaultValue)) {
    throw new Error('SelectField defaultValue must match one of the options.')
  }

  return {
    label: label ?? 'Select Field',
    options,
    validator:
      validator ??
      (z
        .enum(values as [string, ...string[]])
        .default(defaultValue) as z.ZodType<string>),
    ...fieldParams,
    type: 'select' as const,
  }
}

export const LinkField = (params: LinkFieldParams = {}) => ({
  label: 'Link Field',
  validator: z
    .object({
      title: z.string().default('Link'),
      url: z.string().default(''),
      openInNewWindow: z.boolean().default(false),
    })
    .default({
      title: 'Link',
      url: '',
      openInNewWindow: false,
    }) as z.ZodType<LinkFieldValue>,
  ...params,
  type: 'link' as const,
})

export const ImageField = (params: ImageFieldParams = {}) => ({
  label: 'Image Field',
  validator: z
    .preprocess(
      (value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const image = value as Record<string, unknown>
          const imageId = image.imageId ?? image._id
          if (typeof imageId === 'string') return { imageId }
        }

        return value
      },
      z
        .object({
          imageId: z.string(),
        })
        .nullable()
        .default(null),
    )
    .default(null) as z.ZodType<ImageFieldValue>,
  accept: DEFAULT_IMAGE_ACCEPT,
  maxSize: DEFAULT_IMAGE_MAX_SIZE,
  ...params,
  type: 'image' as const,
})

// simple checkbox field - use shadcn/ui switch element in admin
export const CheckboxField = (params: BooleanFieldParams = {}) => ({
  label: 'Checkbox Field',
  validator: z.boolean().default(false) as z.ZodType<boolean>,
  ...params,
  type: 'checkbox' as const,
})

// use shadcn/ui date time picker
export const DateTimeField = (params: NumberFieldParams = {}) => ({
  label: 'Date Time Field',
  time: true,
  validator: z.number().default(Date.now()) as z.ZodType<number>,
  ...params,
  type: 'datetime' as const,
})
