import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from './form'

const DefaultSelectField: FieldProps<
  string,
  { label: string; value: string }[]
> = {
  label: 'Select Field',
  component: lazy(() => import('./select-field-component')),
  defaultValue: '',
  validator: z.string(),
}
export const SelectField = (
  params: Partial<FieldProps<string, { label: string; value: string }[]>>,
) => ({
  ...DefaultSelectField,
  ...params,
})
