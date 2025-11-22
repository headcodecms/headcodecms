import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type {
  FieldProps,
  ImageValue,
  ImageFieldOptions,
} from '@/lib/headcode/types'

const DefaultImageField: FieldProps<ImageValue | null, ImageFieldOptions> = {
  label: 'Image Field',
  component: lazy(() => import('./image-field-uploadthing')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: null,
  validator: z
    .object({
      src: z.string(),
      alt: z.string(),
      width: z.number(),
      height: z.number(),
      blurDataURL: z.string().optional(),
      name: z.string(),
      type: z.union([z.string(), z.null(), z.undefined()]),
      size: z.number(),
    })
    .nullable(),
  options: {
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 10,
    minSize: 1024,
  },
}
export const ImageField = (
  params: Partial<FieldProps<ImageValue | null, ImageFieldOptions>>,
) => ({
  ...DefaultImageField,
  ...params,
})
