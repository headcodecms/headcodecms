import { ZodType } from 'zod'
import { entries, sections } from '@/db/schema'

export type Role = 'user' | 'admin'

export type Entry = typeof entries.$inferSelect
export type AddEntry = typeof entries.$inferInsert

export type Section = typeof sections.$inferSelect
export type AddSection = typeof sections.$inferInsert

export type FieldProps<T, TOptions = unknown> = {
  label: string
  description?: string
  component: React.ComponentType<{
    label: string
    description?: string
    options?: unknown
  }>
  defaultValue: T
  validator: ZodType<T>
  options?: TOptions
}

export type ChildFields = {
  label: string
  fields: Record<string, FieldProps<unknown, unknown>>
}

export type Fields = Record<string, FieldProps<unknown, unknown> | ChildFields>

export type SectionDefinition = {
  name: string
  label: string
  fields: Fields
}

export type SectionReference = {
  section: SectionDefinition
  pinned?: boolean
}

export type SectionName = {
  name: string
  label: string
}

export type HeadcodeConfigEntry =
  | {
      namespace: string
      key: string
      sections: readonly SectionReference[]
    }
  | {
      namespace: string
      key?: never
      sections: readonly SectionReference[]
    }

export type HeadcodeConfig = {
  version: string
  clone?: string
  entries: readonly HeadcodeConfigEntry[]
}

export type InferFieldType<F> =
  F extends FieldProps<infer T, unknown>
    ? T
    : F extends ChildFields
      ? Array<{
          [K in keyof F['fields']]: F['fields'][K] extends FieldProps<
            infer T,
            unknown
          >
            ? T
            : never
        }>
      : never

export type InferSectionData<F extends Fields> = {
  [K in keyof F]: InferFieldType<F[K]>
}

export type ImageSize = {
  width: number
  height: number
}

export type ImageValue = {
  src: string
  alt: string
  width: number
  height: number
  blurDataURL?: string
  name?: string
  type?: string | null | undefined
  size?: number
}

export type ImageFieldOptions = {
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  minSize?: number
}

export type UIEntryType = {
  namespace: string
  dynamic: boolean
}

export type UIEntry = {
  id?: number
  namespace: string
  key: string
  isDynamic: boolean
}
