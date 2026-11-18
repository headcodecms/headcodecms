'use client'

import {
  Bookmark,
  ChevronRight,
  Inbox,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { headcodeConfig } from '@/headcode/config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../_components/admin-ui'
import { AdminShell } from '../_components/chrome'
import {
  call,
  mutate,
  useQuery,
  type Entry as SavedEntry,
  type EntrySummary,
} from '../_lib/api'
import { displayPath, editorHref, parseSlug } from '../_lib/entries'
import { useActions } from '../_lib/use-actions'

const PAGE_SIZE = 20

type Entry = { slug: string; global: boolean }

const collectionSlugs = headcodeConfig.collections.map(({ slug }) => slug)

// Globals always show: one missing in the draft starts from its defaults.
const globalEntries: Entry[] = headcodeConfig.globals.map(({ slug }) => ({
  slug,
  global: true,
}))

const matches = (entry: Entry, query: string) =>
  displayPath(entry.slug).toLowerCase().includes(query.trim().toLowerCase())

// Collection item names: lowercase letters, digits and dashes.
const toName = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, '')

// Search/filter value plus "load more" count, reset when the value changes.
const usePaged = (initial: string) => {
  const [value, setValue] = React.useState(initial)
  const [visible, setVisible] = React.useState(PAGE_SIZE)
  return {
    value,
    visible,
    set: (next: string) => {
      setValue(next)
      setVisible(PAGE_SIZE)
    },
    more: () => setVisible((current) => current + PAGE_SIZE),
  }
}

export default function AdminPage() {
  const router = useRouter()
  const list = useQuery<{ entries: EntrySummary[] }>('entries_list', {
    version: 'draft',
  })
  const { pending, error, run } = useActions<'add' | 'rename' | 'delete'>()

  const all = usePaged('')
  const globals = usePaged('')
  const collections = usePaged(collectionSlugs[0] ?? '')
  const selectedSlug = collections.value

  const [editing, setEditing] = React.useState<Entry | null>(null)
  const [editName, setEditName] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [deleteTarget, setDeleteTarget] = React.useState<Entry | null>(null)

  const draftSlugs = (list.data?.entries ?? []).map(({ slug }) => slug)
  const collectionEntries: Entry[] = draftSlugs
    .filter((slug) => collectionSlugs.includes(parseSlug(slug).type))
    .filter((slug) => parseSlug(slug).name !== null)
    .map((slug) => ({ slug, global: false }))
  const allFiltered = [...globalEntries, ...collectionEntries].filter((entry) =>
    matches(entry, all.value),
  )
  const globalsFiltered = globalEntries.filter((entry) =>
    matches(entry, globals.value),
  )
  const collectionsForSlug = collectionEntries.filter(
    (entry) => parseSlug(entry.slug).type === selectedSlug,
  )

  const assertFree = (slug: string) => {
    if (draftSlugs.includes(slug))
      throw new Error(`An entry ${displayPath(slug)} already exists.`)
  }

  const openEdit = (entry: Entry) => {
    const { name } = parseSlug(entry.slug)
    if (!name) return
    setEditing(entry)
    setEditName(name)
  }

  // A rename saves the entry under the new slug, then deletes the old one.
  const saveEdit = () => {
    if (!editing || !editName) return
    const from = editing.slug
    const to = `${parseSlug(from).type}/${editName}`
    void run(
      'rename',
      async () => {
        if (to !== from) {
          assertFree(to)
          const entry = await call<SavedEntry>('entry_get', {
            slug: from,
            version: 'draft',
          })
          await call('entry_update', { slug: to, sections: entry.sections })
          await mutate('entry_delete', { slug: from })
        }
        setEditing(null)
      },
      'Could not rename entry.',
    )
  }

  const deleteEntry = () => {
    const slug = deleteTarget?.slug
    if (!slug) return
    void run(
      'delete',
      async () => {
        await mutate('entry_delete', { slug })
        setDeleteTarget(null)
      },
      'Could not delete entry.',
    )
  }

  const closeAdd = () => {
    setAdding(false)
    setNewName('')
  }

  const addCollectionEntry = () => {
    const collection = headcodeConfig.collections.find(
      ({ slug }) => slug === selectedSlug,
    )
    if (!newName || !collection) return
    const slug = `${collection.slug}/${newName}`
    void run(
      'add',
      async () => {
        assertFree(slug)
        await mutate('entry_update', { slug, sections: collection.defaults })
        closeAdd()
        router.push(editorHref(slug))
      },
      'Could not add entry.',
    )
  }

  const busy = pending.length > 0
  const listProps = {
    loading: list.data === undefined && !list.error,
    disabled: busy,
    onEdit: openEdit,
    onDelete: setDeleteTarget,
  }

  return (
    <AdminShell
      dialogs={
        <>
          <ConfirmDialog
            open={editing !== null}
            onClose={() => setEditing(null)}
            pending={pending.includes('rename')}
            title="Rename entry"
            description="Change the name of this collection entry."
            confirmLabel="Save"
            confirmDisabled={!editName}
            onConfirm={saveEdit}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                disabled={pending.includes('rename')}
                onChange={(event) => setEditName(toName(event.target.value))}
                autoFocus
              />
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={adding}
            onClose={closeAdd}
            pending={pending.includes('add')}
            title={`Add to ${selectedSlug}`}
            description={`Create a new entry in the ${selectedSlug} collection.`}
            confirmLabel="Add"
            confirmDisabled={!newName}
            onConfirm={addCollectionEntry}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-name">Name</Label>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>/{selectedSlug}/</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="new-name"
                  value={newName}
                  disabled={pending.includes('add')}
                  onChange={(event) => setNewName(toName(event.target.value))}
                  placeholder="entry-name"
                  autoFocus
                />
              </InputGroup>
              <p className="text-muted-foreground text-xs">
                Only lowercase letters, numbers and dashes (-) are allowed. No
                spaces or special characters.
              </p>
            </div>
          </ConfirmDialog>

          <ConfirmDialog
            open={deleteTarget !== null}
            onClose={() => setDeleteTarget(null)}
            pending={pending.includes('delete')}
            title="Delete entry"
            description={`Delete ${deleteTarget ? displayPath(deleteTarget.slug) : 'this entry'}? This removes the entry from the draft; the live site keeps it until you publish.`}
            confirmLabel="Delete"
            confirmVariant="destructive"
            onConfirm={deleteEntry}
          />
        </>
      }
    >
      <Card>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="globals">Globals</TabsTrigger>
            </TabsList>

            <ErrorAlert error={error ?? list.error ?? null} className="mt-4" />

            <TabsContent value="all" className="mt-6">
              <SearchBox
                value={all.value}
                onChange={all.set}
                placeholder="Search entries..."
                autoFocus
              />
              <EntryList
                {...listProps}
                entries={allFiltered}
                visible={all.visible}
                onMore={all.more}
              />
            </TabsContent>

            <TabsContent value="collections" className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Label htmlFor="collection-slug">Slug:</Label>
                <Select
                  value={selectedSlug}
                  disabled={busy}
                  onValueChange={(value) => {
                    if (typeof value === 'string') collections.set(value)
                  }}
                >
                  <SelectTrigger id="collection-slug" className="min-w-48">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionSlugs.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button disabled={busy} onClick={() => setAdding(true)}>
                  <Plus />
                  Add {selectedSlug} entry
                </Button>
              </div>
              <div className="mt-6">
                <EntryList
                  {...listProps}
                  entries={collectionsForSlug}
                  visible={collections.visible}
                  onMore={collections.more}
                  emptyState={
                    <EmptyState
                      icon={<Layers />}
                      title={`No entries in ${selectedSlug}`}
                    >
                      Create the first entry in this collection to get started.
                    </EmptyState>
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="globals" className="mt-6">
              <SearchBox
                value={globals.value}
                onChange={globals.set}
                placeholder="Search globals..."
              />
              <EntryList
                {...listProps}
                entries={globalsFiltered}
                visible={globals.visible}
                onMore={globals.more}
                emptyState={
                  <EmptyState icon={<Bookmark />} title="No globals">
                    No global entries match your search.
                  </EmptyState>
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminShell>
  )
}

const SearchBox = ({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
}) => (
  <div className="relative mb-6">
    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
    <Input
      className="pl-9"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  </div>
)

// Keyboard-navigable listbox of entries with a "Load more" button.
const EntryList = ({
  entries: allEntries,
  visible,
  onMore,
  loading,
  disabled,
  onEdit,
  onDelete,
  emptyState,
}: {
  entries: Entry[]
  visible: number
  onMore: () => void
  loading: boolean
  disabled: boolean
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
  emptyState?: React.ReactNode
}) => {
  const entries = allEntries.slice(0, visible)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rowRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const active = Math.max(0, Math.min(activeIndex, entries.length - 1))
  const last = entries.length - 1

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return event.preventDefault()

    const targets: Record<string, number> = {
      ArrowDown: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    }
    const row = rowRefs.current[active]
    if (event.key in targets) {
      event.preventDefault()
      const index = targets[event.key]
      if (index < 0 || index > last) return
      setActiveIndex(index)
      rowRefs.current[index]?.focus()
    } else if (event.key === 'Enter' && document.activeElement === row) {
      event.preventDefault()
      // The first link/button in a row is its open target.
      row?.querySelector<HTMLElement>('a, button')?.click()
    }
  }

  const list = loading ? (
    <LoadingState>Loading entries</LoadingState>
  ) : entries.length === 0 ? (
    (emptyState ?? (
      <EmptyState icon={<Inbox />} title="No entries">
        There is nothing to show here yet.
      </EmptyState>
    ))
  ) : (
    <ItemGroup
      role="listbox"
      aria-label="Entries"
      aria-activedescendant={`admin-entry-${entries[active]?.slug ?? ''}`}
      aria-busy={disabled}
      onKeyDown={handleKeyDown}
    >
      {entries.map((entry, index) => {
        const isGlobal = entry.global
        const isActive = active === index
        const tabIndex = isActive ? 0 : -1
        const openClassName =
          'after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none'

        return (
          <div
            key={entry.slug}
            ref={(element) => {
              rowRefs.current[index] = element
            }}
            id={`admin-entry-${entry.slug}`}
            role="option"
            aria-selected={isActive}
            tabIndex={tabIndex}
            onFocus={(event) => {
              if (event.target === event.currentTarget) setActiveIndex(index)
            }}
            className={cn(
              'rounded-2xl outline-none',
              'focus-visible:ring-ring focus-visible:ring-2',
              isActive && 'ring-ring/30 ring-2',
              disabled && 'pointer-events-none opacity-70',
            )}
          >
            <Item
              variant="muted"
              size="sm"
              className="hover:bg-muted relative transition-colors"
            >
              <ItemMedia variant="icon">
                {isGlobal ? <Bookmark /> : <Layers />}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <Link
                    href={editorHref(entry.slug)}
                    tabIndex={tabIndex}
                    aria-disabled={disabled}
                    className={openClassName}
                  >
                    {displayPath(entry.slug)}
                  </Link>
                </ItemTitle>
              </ItemContent>
              {isGlobal ? (
                <ItemActions>
                  <ChevronRight className="size-4" />
                </ItemActions>
              ) : (
                <ItemActions className="relative z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label="Actions"
                          tabIndex={tabIndex}
                          disabled={disabled}
                        >
                          <MoreVertical />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={disabled}
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={disabled}
                        onClick={() => onDelete(entry)}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              )}
            </Item>
          </div>
        )
      })}
    </ItemGroup>
  )

  return (
    <>
      {list}
      {allEntries.length > visible && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  )
}
