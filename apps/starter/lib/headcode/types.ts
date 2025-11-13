import { ZodType } from 'zod'

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
export type InferFieldType<F> =
  F extends FieldProps<infer T, unknown> ? T : never
export type InferSectionData<F extends Fields> = {
  [K in keyof F]: InferFieldType<F[K]>
}
export type Section<T extends { fields: Fields }> = InferSectionData<
  T['fields']
>

export type SectionDefinition = {
  name: string
  label: string
  fields: Fields
}

export type SectionReference = {
  section: SectionDefinition
  pinned?: boolean
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
