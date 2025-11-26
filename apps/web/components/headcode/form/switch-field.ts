import { lazy } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultSwitchField: FieldProps<boolean, unknown> = {
  label: 'Switch Field',
  component: lazy(() => import('./switch-field-component')),
  defaultValue: false,
  validator: z.boolean(),
}
export const SwitchField = (
  params: Partial<FieldProps<boolean, unknown>>,
) => ({
  ...DefaultSwitchField,
  ...params,
})

