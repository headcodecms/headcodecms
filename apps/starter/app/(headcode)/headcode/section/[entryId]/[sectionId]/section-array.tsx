'use client'

import TextFieldComponent from '@/components/headcode/form/text-field-component'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { FieldLabel } from '@/components/ui/field'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import type { ChildFields } from '@/lib/headcode/types'
import { GripVerticalIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { useAppForm } from '@/components/headcode/form/form'
import { SectionChildFields } from './section-child-fields'
import {
  createStableIdsState,
  updateStableIds,
  reorderStableIds,
  type StableIdsState,
} from './use-stable-ids'
import { useRef } from 'react'

interface SectionArrayProps {
  form: ReturnType<typeof useAppForm<Record<string, unknown>, unknown>>
  nameKey: string
  field: ChildFields
  getDefaultArrayValue: () => Record<string, unknown>
}

export function SectionArray({
  form,
  nameKey,
  field,
  getDefaultArrayValue,
}: SectionArrayProps) {
  const [openStates, setOpenStates] = useState<Record<number, boolean>>({})
  const [isMounted, setIsMounted] = useState(false)
  const stableIdsStateRef = useRef<StableIdsState>(createStableIdsState())

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getFirstTextFieldKey = (): string | null => {
    for (const [childKey, childField] of Object.entries(field.fields)) {
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

        // Update stable IDs based on current array length
        updateStableIds(stableIdsStateRef.current, formFieldValues.length)

        const stableIds = stableIdsStateRef.current.stableIds
        const sortableItems = formFieldValues.map((_, index) => ({
          id: stableIds.get(index)!,
        }))

        const handleRemove = (index: number) => {
          formField.removeValue(index)
        }

        const handleSortingValueChange = (items: Array<{ id: string }>) => {
          // Map stable IDs back to original indices
          const idToIndex = new Map<string, number>()
          stableIds.forEach((stableId, index) => {
            idToIndex.set(stableId, index)
          })

          // Reorder values based on new item order
          const reorderedValues = items.map((item) => {
            const originalIndex = idToIndex.get(item.id)!
            return formFieldValues[originalIndex]
          })

          // Update stable IDs with new order
          const newStableIds = reorderStableIds(stableIds, items)
          stableIds.clear()
          newStableIds.forEach((value, key) => {
            stableIds.set(key, value)
          })

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
                  formField.pushValue(getDefaultArrayValue() as never)
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
                    stableIds.get(index) || index.toString()
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
                                {firstTextFieldKey && isMounted && (
                                  <form.AppField
                                    name={`${nameKey}[${index}].${firstTextFieldKey}`}
                                  >
                                    {(textField) => {
                                      const value = textField.state
                                        .value as string
                                      const hasValue =
                                        value &&
                                        typeof value === 'string' &&
                                        value.trim()
                                      if (!hasValue) {
                                        return null
                                      }
                                      return (
                                        <span className="text-muted-foreground/50 hidden max-w-xs truncate md:block">
                                          {value}
                                        </span>
                                      )
                                    }}
                                  </form.AppField>
                                )}
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
                            form={form}
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

