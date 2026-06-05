import { headcodeConfig } from '../headcode/config'
import {
  HeadcodeFieldConfig,
  HeadcodeSectionConfig,
  HeadcodeSectionLike,
} from '../headcode/types'

const getSectionConfigs = () => {
  const sectionConfigs = new Map<string, HeadcodeSectionConfig>()

  for (const entryConfig of [
    ...headcodeConfig.globals,
    ...headcodeConfig.collections,
  ]) {
    for (const section of entryConfig.sections) {
      sectionConfigs.set(section.name, section)
    }
  }

  return sectionConfigs
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getFieldSchema = (field: HeadcodeFieldConfig) => {
  if (Array.isArray(field)) return null
  return field.validation ?? field.validator ?? null
}

const logValidationIssue = (path: string, reason: unknown) => {
  console.warn(`[headcode] Invalid section field "${path}". Using default.`, {
    reason,
  })
}

const defaultValueForField = (
  field: HeadcodeFieldConfig,
  path: string,
): unknown => {
  if (Array.isArray(field)) return []

  const schema = getFieldSchema(field)
  if (!schema) return null

  const parsed = schema.safeParse(undefined)
  if (parsed.success) return parsed.data

  logValidationIssue(path, parsed.error)
  return null
}

const validateArrayField = (
  value: unknown,
  itemFields: Record<string, HeadcodeFieldConfig>,
  path: string,
) => {
  if (value === undefined || value === null) return []

  if (!Array.isArray(value)) {
    logValidationIssue(path, 'Expected array.')
    return []
  }

  return value
    .filter((item, index) => {
      if (isObject(item)) return true

      logValidationIssue(`${path}.${index}`, 'Expected object.')
      return false
    })
    .map((item, index) =>
      validateSectionData(item, itemFields, `${path}.${index}`),
    )
}

export const parseSectionData = (data: HeadcodeSectionLike['data']) => {
  if (typeof data !== 'string') return data

  try {
    const parsed = JSON.parse(data) as unknown
    if (isObject(parsed)) return parsed

    throw new Error('Section data must be a JSON object.')
  } catch (error) {
    throw new Error('Section data must be valid JSON.', { cause: error })
  }
}

export const getSectionConfig = (name: string) => {
  const sectionConfigs = getSectionConfigs()
  const sectionConfig = sectionConfigs.get(name)
  if (!sectionConfig) {
    throw new Error(`Unknown section "${name}".`)
  }

  return sectionConfig
}

export const validateSectionData = (
  data: unknown,
  fields: Record<string, HeadcodeFieldConfig>,
  path = 'data',
) => {
  const input = isObject(data) ? data : {}
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(fields)) {
    const field = fields[key]
    const value = input[key]
    const fieldPath = `${path}.${key}`

    if (Array.isArray(field)) {
      result[key] = validateArrayField(value, field[0] ?? {}, fieldPath)
      continue
    }

    const schema = getFieldSchema(field)
    if (!schema) continue

    const parsed = schema.safeParse(value)
    if (parsed.success) {
      result[key] = parsed.data
      continue
    }

    logValidationIssue(fieldPath, parsed.error)
    result[key] = defaultValueForField(field, fieldPath)
  }

  return result
}

export const validateSectionDataForName = (
  name: string,
  data: HeadcodeSectionLike['data'],
) => {
  const sectionConfig = getSectionConfig(name)
  return validateSectionData(parseSectionData(data), sectionConfig.fields)
}

export const validateSection = <TSection extends HeadcodeSectionLike | null>(
  section: TSection,
) => {
  if (section === null) return null

  return {
    ...section,
    data: validateSectionDataForName(section.name, section.data),
  }
}

export const validateSectionForStorage = <
  TSection extends HeadcodeSectionLike,
>(
  section: TSection,
) => ({
  ...section,
  data: JSON.stringify(validateSectionDataForName(section.name, section.data)),
})
