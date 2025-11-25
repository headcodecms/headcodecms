import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type {
  FieldProps,
  ImageValue,
  ImageFieldOptions,
} from '@/lib/headcode/types'

const DefaultImageField: FieldProps<ImageValue | null, ImageFieldOptions> = {
  label: 'Image Field',
  component: lazy(() => import('./image-field-component')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: null,
  validator: z
    .object({
      src: z.string(),
      alt: z.string().default('Image'),
      width: z.number(),
      height: z.number(),
      blurDataURL: z.string().optional(),
      name: z.string().optional(),
      type: z.union([z.string(), z.null(), z.undefined()]).optional(),
      size: z.number().optional(),
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
