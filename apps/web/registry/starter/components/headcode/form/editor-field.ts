import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'
import type { JSONContent } from '@/components/headcode/editor'

const DefaultEditorField: FieldProps<JSONContent | null, unknown> = {
  label: 'Editor Field',
  component: lazy(() => import('./editor-field-component')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: null,
  validator: z.any().nullable(),
}
export const EditorField = (
  params: Partial<FieldProps<JSONContent | null, unknown>>,
) => ({
  ...DefaultEditorField,
  ...params,
})
