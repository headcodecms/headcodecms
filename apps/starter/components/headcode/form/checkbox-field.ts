import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultCheckboxField: FieldProps<boolean, unknown> = {
  label: 'Checkbox Field',
  component: lazy(() => import('./checkbox-field-component')),
  defaultValue: false,
  validator: z.boolean(),
}
export const CheckboxField = (
  params: Partial<FieldProps<boolean, unknown>>,
) => ({
  ...DefaultCheckboxField,
  ...params,
})
