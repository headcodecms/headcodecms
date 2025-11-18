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
import type { EntriesToSectionsWithNames, Entry } from '@/db'
import { getUnpinnedSectionNames } from '@/lib/headcode/config'
import { GripVerticalIcon, PinIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { DialogAddSection } from '../dialogs'
import { toast } from 'sonner'
import { reorderSectionEntries } from './actions'

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
  entry,
  entriesToSections,
  sectionId,
}: {
  entry: Entry
  entriesToSections: EntriesToSectionsWithNames[]
  sectionId: number
}) {
  const [entries, setEntries] = useState(toSortableEntries(entriesToSections))
  const sectionNames = getUnpinnedSectionNames(entry.namespace, entry.key)
  console.log('sectionNames', sectionNames)

  const handleValueChange = async (items: SortableEntry[]) => {
    const oldEntries = entries
    setEntries(items)
    console.log('handleValueChange', oldEntries, items)

    const { error } = await reorderSectionEntries(
      items.map((item, index) => ({
        entryId: item.entryId,
        sectionId: item.sectionId,
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
                variant={item.sectionId === sectionId ? 'muted' : 'default'}
                size="sm"
                asChild
              >
                <Link
                  href={`/headcode/section/${item.entryId}/${item.sectionId}`}
                >
                  <SortableItemHandle asChild>
                    <ItemMedia variant="default">
                      <GripVerticalIcon className="text-muted-foreground size-4" />
                    </ItemMedia>
                  </SortableItemHandle>
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
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
