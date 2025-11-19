import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultTextareaField: FieldProps<string> = {
  label: 'Textarea Field',
  component: lazy(() => import('./textarea-field-component')),
  defaultValue: '',
  validator: z.string(),
}
export const TextareaField = (params: Partial<FieldProps<string>>) => ({
  ...DefaultTextareaField,
  ...params,
})
