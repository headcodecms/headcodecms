import { getSchema, getDefaultValues } from './form'
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

  // Handle plain objects (not arrays, not null)
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

    // Validation failed, use defaults
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

  // Handle JSON strings
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

    // After parsing, handle the parsed data
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

      // Validation failed, use defaults
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

  // For arrays or any other unexpected type, return default values
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

