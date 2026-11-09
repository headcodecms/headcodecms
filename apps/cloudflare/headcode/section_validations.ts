import { HeadcodeError } from './authorization'
import { headcodeConfig } from './config'
import type {
  HeadcodeFieldConfig,
  HeadcodeSectionConfig,
  HeadcodeSectionLike,
} from './types'

type Fields = Record<string, HeadcodeFieldConfig>

const sectionConfigs = new Map<string, HeadcodeSectionConfig>(
  [...headcodeConfig.globals, ...headcodeConfig.collections].flatMap((entry) =>
    entry.sections.map((section) => [section.name, section]),
  ),
)

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Reads warn and fall back to defaults; writes collect errors and reject.
type Issues = string[] | undefined

const warn = (path: string, reason: unknown, issues?: Issues) => {
  if (issues)
    issues.push(
      `${path}: ${reason instanceof Error ? reason.message : String(reason)}`,
    )
  else
    console.warn(`[headcode] Invalid section field "${path}". Using default.`, {
      reason,
    })
}

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

const validateArray = (
  value: unknown,
  itemFields: Fields,
  path: string,
  issues: Issues,
) => {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    warn(path, 'Expected array.', issues)
    return []
  }
  return value.flatMap((item, index) => {
    if (isRecord(item))
      return [validateSectionData(item, itemFields, `${path}.${index}`, issues)]
    warn(`${path}.${index}`, 'Expected object.', issues)
    return []
  })
}

// Unknown keys are dropped. Invalid values fall back to the field default,
// or are collected in `issues` when given.
export const validateSectionData = (
  data: unknown,
  fields: Fields,
  path = 'data',
  issues?: Issues,
): Record<string, unknown> => {
  const input = isRecord(data) ? data : {}

  return Object.fromEntries(
    Object.entries(fields).flatMap(([key, field]) => {
      const fieldPath = `${path}.${key}`
      if (Array.isArray(field))
        return [
          [key, validateArray(input[key], field[0] ?? {}, fieldPath, issues)],
        ]

      const schema = field.validator
      if (!schema) return []

      const parsed = schema.safeParse(input[key])
      if (parsed.success) return [[key, parsed.data]]
      warn(
        fieldPath,
        parsed.error.issues.map((issue) => issue.message).join(', '),
        issues,
      )

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

// Writes from the admin, MCP, and seed must be valid; the error names each field.
export const validateSectionForStorage = <TSection extends HeadcodeSectionLike>(
  section: TSection,
) => {
  const issues: string[] = []
  const data = validateSectionData(
    parseSectionData(section.data),
    getSectionConfig(section.name).fields,
    'data',
    issues,
  )
  if (issues.length)
    throw new HeadcodeError(
      `Invalid ${section.name} section. ${issues.join('; ')}`,
    )
  return { ...section, data: JSON.stringify(data) }
}
