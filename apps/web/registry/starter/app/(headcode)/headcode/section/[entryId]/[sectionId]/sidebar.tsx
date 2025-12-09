'use client'

import { ConfirmationDialog } from '@/components/headcode/admin/dialogs'
import type { AppFormInstance } from '@/components/headcode/form/app-form'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import { getConfigSectionNames } from '@/lib/headcode/config'
import type { Entry, Section } from '@/lib/headcode/types'
import { GripVerticalIcon, PinIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DialogAddSection } from '../dialogs'
import { reorderSections } from './actions'

export function Sidebar({
  entry,
  sections,
  sectionId,
  form,
}: {
  entry: Entry
  sections: Section[]
  sectionId: number
  form: AppFormInstance | null
}) {
  const [entries, setEntries] = useState(sections)
  const sectionNames = getConfigSectionNames(entry.namespace, entry.key, false)
  const router = useRouter()
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  )
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    setEntries(sections)
  }, [sections])

  const handleValueChange = async (items: Section[]) => {
    const oldEntries = entries
    setEntries(items)

    const { error } = await reorderSections(
      entry.id,
      items.map((item, index) => ({
        id: item.id,
        pos: index,
      })),
    )

    if (error) {
      toast.error(error)
      setEntries(oldEntries)
    }
  }

  const handleConfirmNavigation = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (pendingNavigation) {
      setShowConfirmDialog(false)
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    targetSectionId: number,
    isDirty: boolean,
  ) => {
    if (isDirty && targetSectionId !== sectionId) {
      e.preventDefault()
      setPendingNavigation(href)
      setShowConfirmDialog(true)
    }
  }

  const renderSidebarContent = (isDirty: boolean = false) => (
    <>
      <h3 className="mb-4 text-base font-bold">Sections</h3>
      <Sortable
        value={entries}
        onValueChange={handleValueChange}
        getItemValue={(item) => item.id}
      >
        <SortableContent>
          {entries.map((item) => (
            <SortableItem
              key={item.id}
              value={item.id}
              className="my-1"
              asChild
            >
              <Item
                key={item.id}
                variant={item.id === sectionId ? 'muted' : 'default'}
                size="sm"
                asChild
              >
                <Link
                  href={`/headcode/section/${item.entryId}/${item.id}`}
                  onClick={(e) =>
                    handleLinkClick(
                      e,
                      `/headcode/section/${item.entryId}/${item.id}`,
                      item.id,
                      isDirty,
                    )
                  }
                >
                  <SortableItemHandle asChild>
                    <ItemMedia variant="default">
                      <GripVerticalIcon className="text-muted-foreground size-4" />
                    </ItemMedia>
                  </SortableItemHandle>
                  <ItemContent>
                    <ItemTitle>
                      {sectionNames.find(
                        (section) => section.name === item.name,
                      )?.label || item.name}
                    </ItemTitle>
                  </ItemContent>
                  {item.pinned && (
                    <ItemActions>
                      <PinIcon className="text-muted-foreground size-4" />
                    </ItemActions>
                  )}
                </Link>
              </Item>
            </SortableItem>
          ))}
        </SortableContent>
        <SortableOverlay>
          <Item variant="muted" size="sm" asChild>
            <ItemContent>
              <ItemTitle>&nbsp;</ItemTitle>
            </ItemContent>
          </Item>
        </SortableOverlay>
      </Sortable>
      {sectionNames.length > 0 && (
        <DialogAddSection entry={entry} sectionNames={sectionNames} />
      )}
      <ConfirmationDialog
        open={showConfirmDialog}
        setOpen={(open) => {
          setShowConfirmDialog(open)
          if (!open) {
            setPendingNavigation(null)
          }
        }}
        title="You have unsaved changes"
        description="You have unsaved changes. Leave and lose changes?"
        buttonText="Leave and lose changes"
        isSubmitting={false}
        handleSubmit={handleConfirmNavigation}
      />
    </>
  )

  if (form) {
    return (
      <form.Subscribe selector={(state) => state.isDirty}>
        {(isDirty) => renderSidebarContent(isDirty)}
      </form.Subscribe>
    )
  }

  return renderSidebarContent(false)
}
