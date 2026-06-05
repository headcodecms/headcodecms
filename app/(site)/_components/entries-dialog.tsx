'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item'
import type { DataHeadcode } from '@/headcode/types'

export const EntriesDialog = () => {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  void pathname

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const entries = getEntriesFromPage()
  const linkRefs = React.useRef<Array<HTMLAnchorElement | null>>([])
  const itemRefs = React.useRef<Array<Array<HTMLAnchorElement | null>>>([])
  const [activeCard, setActiveCard] = React.useState(0)
  const [activeItem, setActiveItem] = React.useState(-1)

  React.useEffect(() => {
    linkRefs.current.length = entries.length
    itemRefs.current.length = entries.length
    for (let index = 0; index < entries.length; index++) {
      itemRefs.current[index] ??= []
      itemRefs.current[index].length = entries[index]?.items.length ?? 0
    }
  }, [entries])

  const focusCardLink = (cardIndex: number) => {
    setActiveCard(cardIndex)
    setActiveItem(-1)
    linkRefs.current[cardIndex]?.focus()
  }

  const focusItem = (cardIndex: number, itemIndex: number) => {
    setActiveCard(cardIndex)
    setActiveItem(itemIndex)
    itemRefs.current[cardIndex]?.[itemIndex]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const itemsLength = entries[activeCard]?.items.length ?? 0
    if (event.key === 'Tab') {
      const nextCard = activeCard + (event.shiftKey ? -1 : 1)
      if (nextCard >= 0 && nextCard < entries.length) {
        event.preventDefault()
        focusCardLink(nextCard)
      }
    }

    if (event.key === 'ArrowDown') {
      if (activeItem === -1) {
        if (itemsLength === 0) return
        event.preventDefault()
        focusItem(activeCard, 0)
      } else if (activeItem < itemsLength - 1) {
        event.preventDefault()
        focusItem(activeCard, activeItem + 1)
      }
    }

    if (event.key === 'ArrowUp') {
      if (activeItem === 0) {
        event.preventDefault()
        focusCardLink(activeCard)
      } else if (activeItem > 0) {
        event.preventDefault()
        focusItem(activeCard, activeItem - 1)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle>Entries</DialogTitle>
          <DialogDescription>
            Entries that compose this page. Click one to open it in the admin.
          </DialogDescription>
        </DialogHeader>
        <div
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6"
          onKeyDown={handleKeyDown}
        >
          {entries.map((entry, index) => (
            <EntryCard
              key={entry.path}
              entry={entry}
              linkRef={(element) => {
                linkRefs.current[index] = element
              }}
              itemRef={(itemIndex, element) => {
                itemRefs.current[index] ??= []
                itemRefs.current[index][itemIndex] = element
              }}
              onLinkFocus={() => {
                setActiveCard(index)
                setActiveItem(-1)
              }}
              onItemFocus={(itemIndex) => {
                setActiveCard(index)
                setActiveItem(itemIndex)
              }}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
        <DialogFooter className="shrink-0 border-t p-6" showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

const EntryCard = ({
  entry,
  linkRef,
  itemRef,
  onLinkFocus,
  onItemFocus,
  onNavigate,
}: {
  entry: EditableEntry
  linkRef: (element: HTMLAnchorElement | null) => void
  itemRef: (itemIndex: number, element: HTMLAnchorElement | null) => void
  onLinkFocus: () => void
  onItemFocus: (itemIndex: number) => void
  onNavigate: () => void
}) => (
  <div className="focus-within:ring-ring rounded-4xl outline-none focus-within:ring-2">
    <Card size="sm" className="hover:bg-muted/50 w-full transition-colors">
      <CardHeader>
        <Link
          ref={linkRef}
          href={entry.href}
          onClick={onNavigate}
          onFocus={(event) => {
            if (event.target === event.currentTarget) onLinkFocus()
          }}
          className="focus-visible:outline-none"
        >
          <CardTitle className="font-mono text-sm">{entry.path}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {entry.items.map((item, index) => (
            <Link
              key={item.id}
              ref={(element) => itemRef(index, element)}
              href={getSectionHref(entry.href, item.id)}
              onClick={onNavigate}
              onFocus={() => onItemFocus(index)}
              tabIndex={-1}
              className="focus-visible:ring-ring block rounded-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <Item variant="muted" size="sm">
                <ItemContent>
                  <ItemTitle>{item.label}</ItemTitle>
                  {item.description ? (
                    <ItemDescription>{item.description}</ItemDescription>
                  ) : null}
                </ItemContent>
              </Item>
            </Link>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  </div>
)

type EntryItem = {
  id: string
  label: string
  description?: string
  pos: number
}

type EditableEntry = {
  id: string
  path: string
  href: string
  items: EntryItem[]
}

const getEntriesFromPage = () => {
  if (typeof document === 'undefined') return []

  const entries = new Map<string, EditableEntry>()

  document
    .querySelectorAll<HTMLElement>('[data-headcode]')
    .forEach((element) => {
      const headcode = parseDataHeadcode(element.dataset.headcode)
      if (!headcode) return

      const entry =
        entries.get(headcode.entry.id) ??
        ({
          id: headcode.entry.id,
          path: getEntryPath(headcode.entry),
          href: getAdminEntryHref(headcode.entry),
          items: [],
        } satisfies EditableEntry)

      entries.set(headcode.entry.id, entry)

      if (entry.items.some((item) => item.id === headcode.section.id)) return

      entry.items.push({
        id: headcode.section.id,
        label: titleFromSlug(headcode.section.name),
        description: headcode.section.description,
        pos: headcode.section.pos,
      })
    })

  return Array.from(entries.values()).map((entry) => ({
    ...entry,
    items: entry.items.sort((a, b) => a.pos - b.pos),
  }))
}

const parseDataHeadcode = (value: string | undefined) => {
  if (!value) return null

  try {
    return JSON.parse(value) as DataHeadcode
  } catch {
    return null
  }
}

const getEntryPath = (entry: DataHeadcode['entry']) => {
  if (entry.name === null) {
    return entry.slug === 'home' ? '/homepage' : `/${entry.slug}`
  }

  return `/${entry.slug}/${slugify(entry.name)}`
}

const getAdminEntryHref = (entry: DataHeadcode['entry']) => {
  const params = new URLSearchParams({ slug: entry.slug })
  if (entry.name) params.set('name', entry.name)

  return `/admin/entries/${entry.id}?${params.toString()}`
}

const getSectionHref = (href: string, sectionId: string) => {
  const [pathname, search = ''] = href.split('?')
  const params = new URLSearchParams(search)
  params.set('section', sectionId)

  return `${pathname}?${params.toString()}`
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
