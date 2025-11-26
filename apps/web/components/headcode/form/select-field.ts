import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultSelectField: FieldProps<
  string,
  { label: string; value: string }[]
> = {
  label: 'Select Field',
  component: lazy(() => import('./select-field-component')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: '',
  validator: z.string(),
}
export const SelectField = (
  params: Partial<FieldProps<string, { label: string; value: string }[]>>,
) => ({
  ...DefaultSelectField,
  ...params,
})
