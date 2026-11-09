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
import { entryPath } from '@/headcode/utils'

type EditableEntry = {
  path: string
  href: string
  items: {
    id: string
    href: string
    label: string
    description?: string
    pos: number
  }[]
}

const adminHref = (entry: DataHeadcode['entry'], section?: string) => {
  const params = new URLSearchParams({ slug: entry.slug })
  if (entry.name) params.set('name', entry.name)
  if (section) params.set('section', section)
  return `/admin/entries/${entry.id}?${params}`
}

const parseDataHeadcode = (value = '') => {
  try {
    return JSON.parse(value) as DataHeadcode
  } catch {
    return null
  }
}

// Collects the entries/sections marked with `data-headcode` on the page.
const getEntriesFromPage = () => {
  if (typeof document === 'undefined') return []
  const entries = new Map<string, EditableEntry>()

  document.querySelectorAll<HTMLElement>('[data-headcode]').forEach((el) => {
    const headcode = parseDataHeadcode(el.dataset.headcode)
    if (!headcode) return
    const { entry: data, section } = headcode
    const entry = entries.get(data.id) ?? {
      path: entryPath(data),
      href: adminHref(data),
      items: [],
    }
    entries.set(data.id, entry)
    if (entry.items.some((item) => item.id === section.id)) return
    entry.items.push({
      id: section.id,
      href: adminHref(data, section.id),
      label: section.name
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      description: section.description,
      pos: section.pos,
    })
  })

  return Array.from(entries.values(), (entry) => ({
    ...entry,
    items: entry.items.sort((a, b) => a.pos - b.pos),
  }))
}

export const EntriesDialog = () => {
  // Re-render on navigation so the entries are read from the new page.
  usePathname()
  const [open, setOpen] = React.useState(false)
  const entries = getEntriesFromPage()

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

  // Tab moves between entry cards, arrow keys move within a card.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const cards = Array.from(event.currentTarget.children)
    const card = cards.findIndex((element) => element.contains(target))
    const links = Array.from(cards[card]?.querySelectorAll('a') ?? [])
    const index = links.indexOf(target as HTMLAnchorElement)
    if (index < 0) return

    const next =
      event.key === 'Tab'
        ? cards[card + (event.shiftKey ? -1 : 1)]?.querySelector('a')
        : event.key === 'ArrowDown'
          ? links[index + 1]
          : event.key === 'ArrowUp' && index > 0
            ? links[index - 1]
            : null
    if (next) {
      event.preventDefault()
      next.focus()
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
          {entries.map((entry) => (
            <div
              key={entry.path}
              className="focus-within:ring-ring rounded-4xl outline-none focus-within:ring-2"
            >
              <Card
                size="sm"
                className="hover:bg-muted/50 w-full transition-colors"
              >
                <CardHeader>
                  <Link
                    href={entry.href}
                    onClick={() => setOpen(false)}
                    className="focus-visible:outline-none"
                  >
                    <CardTitle className="font-mono text-sm">
                      {entry.path}
                    </CardTitle>
                  </Link>
                </CardHeader>
                <CardContent>
                  <ItemGroup>
                    {entry.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        tabIndex={-1}
                        className="focus-visible:ring-ring block rounded-md focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Item variant="muted" size="sm">
                          <ItemContent>
                            <ItemTitle>{item.label}</ItemTitle>
                            {item.description ? (
                              <ItemDescription>
                                {item.description}
                              </ItemDescription>
                            ) : null}
                          </ItemContent>
                        </Item>
                      </Link>
                    ))}
                  </ItemGroup>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <DialogFooter className="shrink-0 border-t p-6" showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
