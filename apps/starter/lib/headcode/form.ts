import { z } from 'zod'
import type { Fields, ChildFields } from './types'

const buildChildFieldsSchema = (
  childFields: ChildFields,
): z.ZodArray<z.ZodObject<Record<string, z.ZodType>>> => {
  const childSchema = z.object(
    Object.entries(childFields.fields).reduce(
      (acc, [key, field]) => {
        acc[key] = field.validator
        return acc
      },
      {} as Record<string, z.ZodType>,
    ),
  )
  return z.array(childSchema)
}

export const getSchema = (fields: Fields) => {
  return z.object(
    Object.entries(fields).reduce(
      (acc, [key, value]) => {
        if (value.hasOwnProperty('defaultValue')) {
          // @ts-expect-error - value is FieldProps
          acc[key] = value.validator
        } else {
          acc[key] = buildChildFieldsSchema(value as ChildFields)
        }
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

export const getDefaultSectionValues = (
  fields: Fields,
  data: unknown | null,
) => {
  const defaultValues = getDefaultValues(fields)

  if (data) {
    const parsedData = JSON.parse(data as string)
    Object.entries(parsedData).forEach(([key, value]) => {
      if (defaultValues[key]) {
        defaultValues[key] = value
      }
    })
  }

  return defaultValues
}
