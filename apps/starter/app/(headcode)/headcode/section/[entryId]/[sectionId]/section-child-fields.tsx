'use client'

import { FieldGroup } from '@/components/ui/field'
import type { ChildFields, FieldProps } from '@/lib/headcode/types'
import type { useAppForm } from '@/components/headcode/form/form'

interface SectionChildFieldsProps {
  form: ReturnType<typeof useAppForm<Record<string, unknown>, unknown>>
  parentKey: string
  index: number
  child: Record<string, unknown>
  field: ChildFields
}

export function SectionChildFields({
  form,
  parentKey,
  index,
  child,
  field,
}: SectionChildFieldsProps) {
  return (
    <FieldGroup className="pt-3 pb-5">
      {Object.keys(child).map((childKey) => {
        const childField = field.fields[
          childKey as keyof typeof field.fields
        ] as FieldProps<unknown, unknown>
        return (
          <form.AppField
            key={`${childKey}-${index}`}
            name={`${parentKey}[${index}].${childKey}`}
          >
            {() => (
              <childField.component
                label={childField.label}
                description={childField.description ?? undefined}
                options={childField.options as unknown}
              />
            )}
          </form.AppField>
        )
      })}
    </FieldGroup>
  )
}

