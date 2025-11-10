import { z } from 'zod'
import type { Fields } from '@/components/headcode/form/form'

export const getSchema = (fields: Fields) => {
  return z.object(
    Object.entries(fields).reduce(
      (acc, [key, value]) => {
        acc[key] = value.hasOwnProperty('defaultValue')
          ? // @ts-expect-error - value can be a FieldProps or a Record<string, FieldProps>
            value.validator
          : z.array(z.object({}))
        return acc
      },
      {} as Record<string, z.ZodType>,
    ),
  )
}

export const getDefaultValues = (fields: Fields) => {
  return Object.entries(fields).reduce(
    (acc, [key, value]) => {
      // @ts-expect-error - value can be a FieldProps or a Record<string, FieldProps>
      acc[key] = value.hasOwnProperty('defaultValue') ? value.defaultValue : []
      return acc
    },
    {} as Record<string, unknown>,
  )
}

export const getDefaultSectionValues = (fields: Fields, data: unknown) => {
  const defaultValues = getDefaultValues(fields)
  defaultValues.description = 'Description from data'
  defaultValues.plans = [
    {
      plan: 'Plan 1',
      price: 100,
    },
    {
      plan: 'Plan 2',
      price: 200,
    },
  ]
  // merge default values with data
  return defaultValues
}
