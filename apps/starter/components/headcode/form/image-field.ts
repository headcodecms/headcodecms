import type {
  FieldProps,
  ImageFieldOptions,
  ImageValue,
} from '@/lib/headcode/types'
import { lazy, type ComponentType } from 'react'
import { z } from 'zod'

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
      id: z.number().default(0),
      src: z.string(),
      alt: z.string(),
      width: z.number(),
      height: z.number(),
      blurDataURL: z.string().nullable(),
      name: z.string().nullable(),
      type: z.string().nullable(),
      size: z.number().nullable(),
      service: z.string().default(''),
      serviceId: z.string().default(''),
      createdAt: z.coerce.date().default(new Date()),
      updatedAt: z.coerce.date().default(new Date()),
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
