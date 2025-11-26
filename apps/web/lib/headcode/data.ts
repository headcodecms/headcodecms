import { getSchema, getDefaultValues } from './fields'
import type { Fields, InferSectionData } from './types'

export function parseSectionData<F extends Fields>(
  fields: F,
  sectionData: unknown,
): { data: InferSectionData<F>; isDefault: boolean } {
  const schema = getSchema(fields)
  const defaultValues = getDefaultValues(fields)

  if (sectionData === null || sectionData === undefined) {
    const result = schema.safeParse(defaultValues)
    return {
      data: result.success
        ? (result.data as InferSectionData<F>)
        : (defaultValues as InferSectionData<F>),
      isDefault: true,
    }
  }

  if (
    typeof sectionData === 'object' &&
    !Array.isArray(sectionData) &&
    sectionData !== null
  ) {
    const filteredData: Record<string, unknown> = {}
    Object.keys(fields).forEach((key) => {
      if (key in sectionData) {
        filteredData[key] = (sectionData as Record<string, unknown>)[key]
      } else {
        filteredData[key] = defaultValues[key]
      }
    })

    const result = schema.safeParse(filteredData)
    if (result.success) {
      return {
        data: result.data as InferSectionData<F>,
        isDefault: false,
      }
    }

    console.error('Validation failed, using default values', {
      error: result.error,
      filteredData,
      defaultValues,
    })
    const defaultResult = schema.safeParse(defaultValues)
    return {
      data: defaultResult.success
        ? (defaultResult.data as InferSectionData<F>)
        : (defaultValues as InferSectionData<F>),
      isDefault: true,
    }
  }

  if (typeof sectionData === 'string') {
    let parsedData: unknown
    try {
      parsedData = JSON.parse(sectionData)
    } catch (error) {
      console.error('JSON parsing failed, using default values', {
        error,
        sectionData,
      })
      const defaultResult = schema.safeParse(defaultValues)
      return {
        data: defaultResult.success
          ? (defaultResult.data as InferSectionData<F>)
          : (defaultValues as InferSectionData<F>),
        isDefault: true,
      }
    }

    if (
      parsedData &&
      typeof parsedData === 'object' &&
      !Array.isArray(parsedData) &&
      parsedData !== null
    ) {
      const filteredData: Record<string, unknown> = {}
      Object.keys(fields).forEach((key) => {
        if (key in parsedData) {
          filteredData[key] = (parsedData as Record<string, unknown>)[key]
        } else {
          filteredData[key] = defaultValues[key]
        }
      })

      const result = schema.safeParse(filteredData)
      if (result.success) {
        return {
          data: result.data as InferSectionData<F>,
          isDefault: false,
        }
      }

      console.error(
        'Validation failed after JSON parse, using default values',
        {
          error: result.error,
          filteredData,
          defaultValues,
        },
      )
      const defaultResult = schema.safeParse(defaultValues)
      return {
        data: defaultResult.success
          ? (defaultResult.data as InferSectionData<F>)
          : (defaultValues as InferSectionData<F>),
        isDefault: true,
      }
    }
  }

  console.warn('Unexpected sectionData type, using default values', {
    type: typeof sectionData,
    isArray: Array.isArray(sectionData),
    sectionData,
  })
  const defaultResult = schema.safeParse(defaultValues)
  return {
    data: defaultResult.success
      ? (defaultResult.data as InferSectionData<F>)
      : (defaultValues as InferSectionData<F>),
    isDefault: true,
  }
}
