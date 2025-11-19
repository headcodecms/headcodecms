import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultTextField: FieldProps<string, unknown> = {
  label: 'Text Field',
  component: lazy(() => import('./text-field-component')),
  defaultValue: '',
  validator: z.string(),
}
export const TextField = (params: Partial<FieldProps<string, unknown>>) => ({
  ...DefaultTextField,
  ...params,
})
