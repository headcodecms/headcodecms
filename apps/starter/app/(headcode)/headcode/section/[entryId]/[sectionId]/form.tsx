'use client'

import { ConfirmationDialog } from '@/components/headcode/admin/dialogs'
import { useAppForm } from '@/components/headcode/form/form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import type { Entry, Section } from '@/lib/headcode/types'
import { getConfigSection } from '@/lib/headcode/config'
import { getDefaultSectionValues, getSchema } from '@/lib/headcode/form'
import { ChildFields, FieldProps } from '@/lib/headcode/types'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteSection, updateSection } from './actions'
import { SectionArray } from './section-array'

export function Form({ entry, section }: { entry: Entry; section: Section }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const configSection = getConfigSection(
    entry.namespace,
    entry.key,
    section.name,
  )

  const fields = configSection.fields
  const formSchema = getSchema(fields)
  const defaultValues = getDefaultSectionValues(fields, section.data)

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const { success, error } = await updateSection({
        ...section,
        data: JSON.stringify(value),
      })
      if (success) {
        toast.success('Section saved successfully')
      } else if (error) {
        toast.warning(error)
      }
    },
  })

  const handleDeleteSection = () => {
    setOpen(true)
  }

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleting(true)

    const { success, error } = await deleteSection(entry.id, section.id)
    setIsDeleting(false)

    if (success) {
      setOpen(false)
    } else if (error) {
      toast.warning(error)
    }
  }

  /**
   * Gets the default value for a new array item based on field configuration.
   * Uses defaultValue from each child field.
   */
  const getDefaultArrayValue = (field: ChildFields): Record<string, unknown> => {
    const defaultValue: Record<string, unknown> = {}
    for (const [key, childField] of Object.entries(field.fields)) {
      defaultValue[key] = childField.defaultValue
    }
    return defaultValue
  }

  const SectionFields = () => (
    <FieldGroup>
      {Object.entries(defaultValues).map(([key, value]) => {
        if (Array.isArray(value)) {
          const field = fields[key as keyof typeof fields] as ChildFields
          return (
            <SectionArray
              key={key}
              form={form}
              nameKey={key}
              field={field}
              getDefaultArrayValue={() => getDefaultArrayValue(field)}
            />
          )
        } else {
          const field = fields[key as keyof typeof fields] as FieldProps<
            unknown,
            unknown
          >
          return (
            <form.AppField key={key} name={key}>
              {() => (
                <field.component
                  label={field.label}
                  description={field.description ?? undefined}
                  options={field.options as unknown}
                />
              )}
            </form.AppField>
          )
        }
      })}
    </FieldGroup>
  )

  const SectionSubmitButtons = () => (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <CardFooter>
          <Field
            orientation="horizontal"
            className="flex w-full items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Button
                disabled={!canSubmit}
                type="submit"
                form="edit-section-form"
              >
                {isSubmitting && <Spinner />}
                Save
              </Button>
              <Button
                disabled={!canSubmit}
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
            </div>
            {!section.pinned && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteSection}
              >
                Delete Section
              </Button>
            )}
          </Field>
        </CardFooter>
      )}
    </form.Subscribe>
  )

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="edit-section-form"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
          >
            <SectionFields />
          </form>
        </CardContent>
        <SectionSubmitButtons />
      </Card>
      <ConfirmationDialog
        open={open}
        setOpen={setOpen}
        title={`Delete section ${section.name}?`}
        description={`This action cannot be undone. This will permanently delete the section ${section.name} from this entry.`}
        buttonText="Delete section"
        isSubmitting={isDeleting}
        handleSubmit={handleConfirmDelete}
      />
    </>
  )
}
