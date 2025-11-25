import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

export type LinkValue = {
  title: string
  url: string
  openInNewWindow: boolean
}

const DefaultLinkField: FieldProps<LinkValue, unknown> = {
  label: 'Link Field',
  component: lazy(() => import('./link-field-component')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: {
    title: '',
    url: '',
    openInNewWindow: false,
  },
  validator: z.object({
    title: z.string(),
    url: z.string(),
    openInNewWindow: z.boolean().default(false),
  }),
}
export const LinkField = (params: Partial<FieldProps<LinkValue, unknown>>) => ({
  ...DefaultLinkField,
  ...params,
})
