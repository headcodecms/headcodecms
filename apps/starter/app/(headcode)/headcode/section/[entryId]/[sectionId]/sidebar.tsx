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
import type { EntriesToSectionsWithNames } from '@/db'
import { GripVerticalIcon, PinIcon } from 'lucide-react'
import { useState } from 'react'

type SortableEntry = EntriesToSectionsWithNames & {
  id: string
  title: string
}
const toSortableEntries = (
  entries: EntriesToSectionsWithNames[],
): SortableEntry[] => {
  return entries.map((entry) => ({
    ...entry,
    id: `${entry.entryId}-${entry.sectionId}`,
    title: entry.name,
  }))
}

export function Sidebar({
  entriesToSections,
  sectionId,
}: {
  entriesToSections: EntriesToSectionsWithNames[]
  sectionId: number
}) {
  const [entries, setEntries] = useState(toSortableEntries(entriesToSections))

  const handleValueChange = async (items: SortableEntry[]) => {
    console.log('handleValueChange', items)
    setEntries(items)
    // const result = await reorderSectionEntries(items)
    // if not success, show error toast and revert the items
    // console.log('result', result)
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
          {entries.map((entry) => (
            <SortableItem
              key={entry.id}
              value={entry.id}
              className="my-1"
              asChild
            >
              <Item
                key={entry.id}
                variant={entry.sectionId === sectionId ? 'muted' : 'default'}
                size="sm"
                asChild
              >
                <a href="#">
                  <SortableItemHandle asChild>
                    <ItemMedia variant="default">
                      <GripVerticalIcon className="text-muted-foreground size-4" />
                    </ItemMedia>
                  </SortableItemHandle>
                  <ItemContent>
                    <ItemTitle>{entry.title}</ItemTitle>
                  </ItemContent>
                  {entry.pinned && (
                    <ItemActions>
                      <PinIcon className="text-muted-foreground size-4" />
                    </ItemActions>
                  )}
                </a>
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
    </>
  )
}
