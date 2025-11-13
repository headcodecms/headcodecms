'use client'

import { ConfirmationDialog } from '@/components/headcode/dialogs'
import {
  ChildFields,
  FieldProps,
  useAppForm,
} from '@/components/headcode/form/form'
import TextFieldComponent from '@/components/headcode/form/text-field-component'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import { Spinner } from '@/components/ui/spinner'
import type { Entry, Section } from '@/db'
import { getConfigSection } from '@/lib/headcode/config'
import { getDefaultSectionValues, getSchema } from '@/lib/headcode/form'
import { GripVerticalIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { deleteSection, updateSection } from './actions'

export function Form({
  entry,
  section,
  canDelete,
}: {
  entry: Entry
  section: Section
  canDelete: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const configSection = getConfigSection(
    entry.namespace,
    entry.key,
    section.name,
  )

  const fields = configSection.fields
  const formSchema = getSchema(fields)
  const defaultValues = getDefaultSectionValues(fields, section.data)
  console.log('Form', defaultValues, formSchema)

  const form = useAppForm({
    defaultValues: getDefaultSectionValues(fields, section.data),
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
    setOpen(false)

    if (success) {
      router.push(`/headcode/section/${entry.id}`)
    } else if (error) {
      toast.warning(error)
    }
  }

  const SectionChildFields = ({
    parentKey,
    index,
    child,
    field,
  }: {
    parentKey: string
    index: number
    child: Record<string, unknown>
    field: ChildFields
  }) => {
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

  const SectionArray = ({
    nameKey,
    field,
  }: {
    nameKey: string
    field: ChildFields
  }) => {
    const [openStates, setOpenStates] = useState<Record<number, boolean>>({})

    const stableIdsRef = useRef<Map<number, string>>(new Map())
    const nextIdRef = useRef(0)
    const lastLengthRef = useRef(0)

    // Helper function to find the first TextField key
    const getFirstTextFieldKey = (): string | null => {
      for (const [childKey, childField] of Object.entries(field.fields)) {
        // Check if the component is TextFieldComponent
        // Since components might be lazy loaded, we check multiple ways
        const component = childField.component
        const isTextField =
          component === TextFieldComponent ||
          (component &&
            typeof component === 'object' &&
            '_payload' in component &&
            (component as { _payload?: { _result?: { default?: unknown } } })
              ._payload?._result?.default === TextFieldComponent)

        if (isTextField) {
          return childKey
        }
      }
      return null
    }

    const firstTextFieldKey = getFirstTextFieldKey()

    return (
      <form.AppField key={nameKey} name={nameKey} mode="array">
        {(formField) => {
          const formFieldValues = formField.state.value as Array<
            Record<string, unknown>
          >

          const currentLength = formFieldValues.length
          if (currentLength !== lastLengthRef.current) {
            const stableIds = stableIdsRef.current

            if (stableIds.size > currentLength) {
              const keysToRemove: number[] = []
              stableIds.forEach((_, key) => {
                if (key >= currentLength) {
                  keysToRemove.push(key)
                }
              })
              keysToRemove.forEach((key) => stableIds.delete(key))
            }

            for (let i = 0; i < currentLength; i++) {
              if (!stableIds.has(i)) {
                stableIds.set(i, `item-${nextIdRef.current++}`)
              }
            }

            lastLengthRef.current = currentLength
          }

          const sortableItems = formFieldValues.map((_, index) => ({
            id: stableIdsRef.current.get(index)!,
          }))

          console.log('formFieldValues', formFieldValues, sortableItems)

          const handleRemove = (index: number) => {
            formField.removeValue(index)
          }

          const handleSortingValueChange = (items: Array<{ id: string }>) => {
            console.log('sorting value change', items)

            const idToIndex = new Map<string, number>()
            stableIdsRef.current.forEach((stableId, index) => {
              idToIndex.set(stableId, index)
            })

            const reorderedValues = items.map((item) => {
              const originalIndex = idToIndex.get(item.id)!
              return formFieldValues[originalIndex]
            })

            const newStableIds = new Map<number, string>()
            items.forEach((item, newIndex) => {
              newStableIds.set(newIndex, item.id)
            })
            stableIdsRef.current = newStableIds
            lastLengthRef.current = reorderedValues.length

            formField.setValue(reorderedValues as never)
          }

          return (
            <div>
              <FieldLabel className="my-3 flex w-full items-center justify-between">
                <div>{field.label}</div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    formField.pushValue({
                      plan: 'Plan',
                      price: 100,
                    } as unknown as never)
                  }}
                >
                  <PlusIcon className="size-4" />
                  Add
                </Button>
              </FieldLabel>

              <Sortable
                value={sortableItems}
                onValueChange={handleSortingValueChange}
                getItemValue={(item) => item.id}
              >
                <SortableContent>
                  {formFieldValues?.map((child, index) => {
                    const stableId =
                      stableIdsRef.current.get(index) || index.toString()
                    return (
                      <SortableItem
                        key={stableId}
                        value={stableId}
                        className="bg-background my-1 overflow-hidden rounded-lg border px-4 dark:border-none"
                        asChild
                      >
                        <Collapsible
                          open={openStates[index] ?? false}
                          onOpenChange={(isOpen) => {
                            setOpenStates((prev) => ({
                              ...prev,
                              [index]: isOpen,
                            }))
                          }}
                        >
                          <div className="flex">
                            <SortableItemHandle asChild>
                              <div className="mr-4 flex-none py-3">
                                <GripVerticalIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
                              </div>
                            </SortableItemHandle>
                            <CollapsibleTrigger className="grow">
                              <div className="flex w-full items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {field.label}
                                  {firstTextFieldKey ? (
                                    <form.AppField
                                      name={`${nameKey}[${index}].${firstTextFieldKey}`}
                                    >
                                      {(textField) => {
                                        const value = textField.state
                                          .value as string
                                        if (
                                          value &&
                                          typeof value === 'string' &&
                                          value.trim()
                                        ) {
                                          return (
                                            <span className="text-muted-foreground/50 hidden max-w-xs truncate md:block">
                                              {value}
                                            </span>
                                          )
                                        }
                                        return null
                                      }}
                                    </form.AppField>
                                  ) : null}
                                </div>
                                <div className="relative size-4 shrink-0">
                                  {(openStates[index] ?? false) ? (
                                    <MinusIcon className="text-muted-foreground absolute inset-0 size-4 transition-opacity duration-200" />
                                  ) : (
                                    <PlusIcon className="text-muted-foreground absolute inset-0 size-4 transition-opacity duration-200" />
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <div className="text-muted-foreground/50 hover:text-muted-foreground flex-none">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleRemove(index)
                                }}
                                className="p-3"
                              >
                                <XIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
                              </button>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <SectionChildFields
                              parentKey={nameKey}
                              index={index}
                              child={child}
                              field={field}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </SortableItem>
                    )
                  })}
                </SortableContent>
                <SortableOverlay>
                  <div className="bg-muted-background overflow-hidden rounded-lg border py-3 dark:border-none">
                    &nbsp;
                  </div>
                </SortableOverlay>
              </Sortable>
            </div>
          )
        }}
      </form.AppField>
    )
  }

  const SectionFields = () => (
    <FieldGroup>
      {Object.entries(defaultValues).map(([key, value]) => {
        if (Array.isArray(value)) {
          const field = fields[key as keyof typeof fields] as ChildFields
          return <SectionArray key={key} nameKey={key} field={field} />
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
            {canDelete && (
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
