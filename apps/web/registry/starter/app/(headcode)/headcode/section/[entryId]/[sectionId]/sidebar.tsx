'use client'

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
import type { Entry, Section } from '@/lib/headcode/types'
import { getConfigSectionNames } from '@/lib/headcode/config'
import { GripVerticalIcon, PinIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { DialogAddSection } from '../dialogs'
import { reorderSections } from './actions'

export function Sidebar({
  entry,
  sections,
  sectionId,
}: {
  entry: Entry
  sections: Section[]
  sectionId: number
}) {
  const [entries, setEntries] = useState(sections)
  const sectionNames = getConfigSectionNames(entry.namespace, entry.key, false)

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

  return (
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
                <Link href={`/headcode/section/${item.entryId}/${item.id}`}>
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
    </>
  )
}
