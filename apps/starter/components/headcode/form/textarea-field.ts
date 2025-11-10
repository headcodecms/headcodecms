import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from './form'

const DefaultTextareaField: FieldProps<string> = {
  label: 'Textarea Field',
  component: lazy(() => import('./textarea-field-component')),
  defaultValue: '',
  validator: z
    .string()
    .min(5, 'Bug title must be at least 5 characters.')
    .max(32, 'Bug title must be at most 32 characters.'),
}
export const TextareaField = (params: Partial<FieldProps<string>>) => ({
  ...DefaultTextareaField,
  ...params,
})
