import { lazy, type ComponentType } from 'react'
import { z } from 'zod'
import type { FieldProps } from '@/lib/headcode/types'

const DefaultDatePickerField: FieldProps<Date | null, { time?: boolean }> = {
  label: 'Date Picker Field',
  component: lazy(
    () => import('./date-picker-field-component'),
  ) as ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>,
  defaultValue: null,
  validator: z.date().nullable(),
  options: { time: false },
}
export const DatePickerField = (
  params: Partial<FieldProps<Date | null, { time?: boolean }>>,
) => ({
  ...DefaultDatePickerField,
  ...params,
})
