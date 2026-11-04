import { headcodeConfig } from '../headcode/config'
import type {
  HeadcodeFieldConfig,
  HeadcodeSectionConfig,
  HeadcodeSectionLike,
} from '../headcode/types'

type Fields = Record<string, HeadcodeFieldConfig>

const sectionConfigs = new Map<string, HeadcodeSectionConfig>(
  [...headcodeConfig.globals, ...headcodeConfig.collections].flatMap((entry) =>
    entry.sections.map((section) => [section.name, section]),
  ),
)

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const warn = (path: string, reason: unknown) =>
  console.warn(`[headcode] Invalid section field "${path}". Using default.`, {
    reason,
  })

export const getSectionConfig = (name: string) => {
  const config = sectionConfigs.get(name)
  if (!config) throw new Error(`Unknown section "${name}".`)
  return config
}

export const parseSectionData = (data: HeadcodeSectionLike['data']) => {
  if (typeof data !== 'string') return data
  try {
    const parsed: unknown = JSON.parse(data)
    if (isRecord(parsed)) return parsed
  } catch {}
  throw new Error('Section data must be valid JSON.')
}

const validateArray = (value: unknown, itemFields: Fields, path: string) => {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    warn(path, 'Expected array.')
    return []
  }
  return value.flatMap((item, index) => {
    if (isRecord(item))
      return [validateSectionData(item, itemFields, `${path}.${index}`)]
    warn(`${path}.${index}`, 'Expected object.')
    return []
  })
}

// Unknown keys are dropped, invalid values fall back to the field default.
export const validateSectionData = (
  data: unknown,
  fields: Fields,
  path = 'data',
): Record<string, unknown> => {
  const input = isRecord(data) ? data : {}

  return Object.fromEntries(
    Object.entries(fields).flatMap(([key, field]) => {
      const fieldPath = `${path}.${key}`
      if (Array.isArray(field))
        return [[key, validateArray(input[key], field[0] ?? {}, fieldPath)]]

      const schema = field.validator
      if (!schema) return []

      const parsed = schema.safeParse(input[key])
      if (parsed.success) return [[key, parsed.data]]
      warn(fieldPath, parsed.error)

      const fallback = schema.safeParse(undefined)
      if (!fallback.success) warn(fieldPath, fallback.error)
      return [[key, fallback.success ? fallback.data : null]]
    }),
  )
}

export const validateSection = <TSection extends HeadcodeSectionLike | null>(
  section: TSection,
) =>
  section && {
    ...section,
    data: validateSectionData(
      parseSectionData(section.data),
      getSectionConfig(section.name).fields,
    ),
  }

export const validateSectionForStorage = <TSection extends HeadcodeSectionLike>(
  section: TSection,
) => ({ ...section, data: JSON.stringify(validateSection(section).data) })
