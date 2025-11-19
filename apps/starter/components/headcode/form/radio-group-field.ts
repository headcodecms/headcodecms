import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultRadioGroupField: FieldProps<
  string,
  { label: string; value: string }[]
> = {
  label: 'Radio Group Field',
  component: lazy(() => import('./radio-group-field-component')) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: '',
  validator: z.string(),
}
export const RadioGroupField = (
  params: Partial<FieldProps<string, { label: string; value: string }[]>>,
) => ({
  ...DefaultRadioGroupField,
  ...params,
})

