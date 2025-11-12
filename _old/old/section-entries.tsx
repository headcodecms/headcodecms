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
import { GripVerticalIcon, PinIcon } from 'lucide-react'
import { useState } from 'react'
import { reorderSectionEntries } from './actions'
import { DialogAddSection } from './dialog-add-section'
import { Entry } from './entry'
import { SectionEntry } from './section-form'

export function SectionEntries({
  sectionEntries,
  sectionId,
  entry,
}: {
  sectionEntries: SectionEntry[]
  sectionId: string
  entry: Entry
}) {
  const [entries, setEntries] = useState(sectionEntries)

  const handleValueChange = async (items: SectionEntry[]) => {
    console.log('handleValueChange', items)
    setEntries(items)
    const result = await reorderSectionEntries(items)
    // if not success, show error toast and revert the items
    console.log('result', result)
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
                variant={entry.id === sectionId ? 'muted' : 'default'}
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
      <DialogAddSection entry={entry} />
    </>
  )
}
