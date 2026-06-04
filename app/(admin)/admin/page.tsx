'use client'

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import {
  Bookmark,
  ChevronRight,
  Inbox,
  Layers,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { headcodeConfig } from '@/headcode/config'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import { AdminHeader } from '../_components/chrome'
import { Container } from '../_components/container'
import { useAdminHeadcodeVersion } from '../_lib/headcode'

const PAGE_SIZE = 20

type Entry = {
  id: string
  convexId: Id<'entries'> | null
  slug: string
  name: string | null
  description?: string
  virtual?: boolean
}

type EntryOperation = 'open' | 'add' | 'rename' | 'delete'

const collectionSlugs = headcodeConfig.collections.map(
  (collection) => collection.slug,
)

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const entryPath = (entry: Entry) =>
  entry.name ? `/${entry.slug}/${slugify(entry.name)}` : `/${entry.slug}`

const entryHref = (entry: Entry) => {
  const params = new URLSearchParams({ slug: entry.slug })
  if (entry.name) params.set('name', entry.name)

  return `/admin/entries/${entry.id}?${params.toString()}`
}

export default function AdminPage() {
  const router = useRouter()
  const { version, resolved: versionResolved } = useAdminHeadcodeVersion()
  const entries = useQuery(api.services.getAll, { version })
  const ensureGlobal = useMutation(api.services.ensureGlobal)
  const addCollection = useMutation(api.services.addCollection)
  const updateEntryName = useMutation(api.services.updateEntryName)
  const removeEntry = useMutation(api.services.deleteEntry)

  const [allQuery, setAllQuery] = React.useState('')
  const [globalsQuery, setGlobalsQuery] = React.useState('')
  const [selectedSlug, setSelectedSlug] = React.useState<string>(
    collectionSlugs[0] ?? '',
  )

  const [allVisible, setAllVisible] = React.useState(PAGE_SIZE)
  const [globalsVisible, setGlobalsVisible] = React.useState(PAGE_SIZE)
  const [collectionsVisible, setCollectionsVisible] = React.useState(PAGE_SIZE)

  const [editing, setEditing] = React.useState<Entry | null>(null)
  const [editName, setEditName] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [deleteTarget, setDeleteTarget] = React.useState<Entry | null>(null)
  const [entryOperation, setEntryOperation] =
    React.useState<EntryOperation | null>(null)
  const [entryError, setEntryError] = React.useState<string | null>(null)

  const globalEntries = React.useMemo(() => {
    const existingGlobals = entries?.globals ?? []

    return headcodeConfig.globals.map((global) => {
      const existing = existingGlobals.find(
        (entry) => entry.slug === global.slug,
      )

      return {
        id: existing?._id ?? `global-${global.slug}`,
        convexId: existing?._id ?? null,
        slug: global.slug,
        name: null,
        description: global.description,
        virtual: !existing,
      } satisfies Entry
    })
  }, [entries])

  const collectionEntries = React.useMemo<Entry[]>(
    () =>
      (entries?.collections ?? []).map((entry) => {
        const config = headcodeConfig.collections.find(
          (collection) => collection.slug === entry.slug,
        )

        return {
          id: entry._id,
          convexId: entry._id,
          slug: entry.slug,
          name: entry.name,
          description: config?.description,
        }
      }),
    [entries],
  )

  const allEntries = React.useMemo(
    () => [...globalEntries, ...collectionEntries],
    [collectionEntries, globalEntries],
  )

  const allFiltered = React.useMemo(() => {
    const q = allQuery.trim().toLowerCase()
    if (!q) return allEntries

    return allEntries.filter((entry) =>
      entryPath(entry).toLowerCase().includes(q),
    )
  }, [allEntries, allQuery])

  const globalsFiltered = React.useMemo(() => {
    const q = globalsQuery.trim().toLowerCase()
    if (!q) return globalEntries

    return globalEntries.filter((entry) =>
      entryPath(entry).toLowerCase().includes(q),
    )
  }, [globalEntries, globalsQuery])

  const collectionsForSlug = React.useMemo(
    () => collectionEntries.filter((entry) => entry.slug === selectedSlug),
    [collectionEntries, selectedSlug],
  )

  const openEntry = async (entry: Entry) => {
    if (entry.convexId) {
      router.push(entryHref(entry))
      return
    }

    setEntryOperation('open')
    setEntryError(null)

    try {
      const id = await ensureGlobal({ slug: entry.slug, version })
      router.push(
        `/admin/entries/${id}?${new URLSearchParams({ slug: entry.slug })}`,
      )
    } catch (openError) {
      setEntryError(
        openError instanceof Error
          ? openError.message
          : 'Could not open entry.',
      )
    } finally {
      setEntryOperation(null)
    }
  }

  const openEdit = (entry: Entry) => {
    if (!entry.convexId || !entry.name) return

    setEditing(entry)
    setEditName(entry.name)
  }

  const saveEdit = async () => {
    if (!editing?.convexId || !editName.trim()) return

    setEntryOperation('rename')
    setEntryError(null)

    try {
      await updateEntryName({ id: editing.convexId, name: editName.trim() })
      setEditing(null)
    } catch (renameError) {
      setEntryError(
        renameError instanceof Error
          ? renameError.message
          : 'Could not rename entry.',
      )
    } finally {
      setEntryOperation(null)
    }
  }

  const deleteEntry = async (entry: Entry) => {
    if (!entry.convexId) return

    setEntryOperation('delete')
    setEntryError(null)

    try {
      await removeEntry({ id: entry.convexId })
      setDeleteTarget(null)
    } catch (deleteError) {
      setEntryError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete entry.',
      )
    } finally {
      setEntryOperation(null)
    }
  }

  const addCollectionEntry = async () => {
    const name = newName.trim()
    if (!name || !selectedSlug) return

    setEntryOperation('add')
    setEntryError(null)

    try {
      const id = await addCollection({ slug: selectedSlug, name, version })
      setNewName('')
      setAdding(false)
      router.push(
        `/admin/entries/${id}?${new URLSearchParams({ slug: selectedSlug, name })}`,
      )
    } catch (addError) {
      setEntryError(
        addError instanceof Error ? addError.message : 'Could not add entry.',
      )
    } finally {
      setEntryOperation(null)
    }
  }

  return (
    <div className="bg-background min-h-svh">
      <AdminHeader version={version} versionResolved={versionResolved} />
      <main>
        <Container className="py-8">
          <AuthLoading>
            <LoadingState />
          </AuthLoading>
          <Unauthenticated>
            <p className="text-muted-foreground text-sm">Signing in...</p>
          </Unauthenticated>
          <Authenticated>
            <Card>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="collections">Collections</TabsTrigger>
                    <TabsTrigger value="globals">Globals</TabsTrigger>
                  </TabsList>

                  {entryError ? (
                    <p role="alert" className="text-destructive mt-4 text-sm">
                      {entryError}
                    </p>
                  ) : null}

                  <TabsContent value="all" className="mt-6">
                    <SearchBox
                      value={allQuery}
                      onChange={(value) => {
                        setAllQuery(value)
                        setAllVisible(PAGE_SIZE)
                      }}
                      placeholder="Search entries..."
                      autoFocus
                    />
                    <EntryList
                      entries={allFiltered.slice(0, allVisible)}
                      loading={entries === undefined}
                      disabled={entryOperation !== null}
                      onOpen={openEntry}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                    {allFiltered.length > allVisible && (
                      <LoadMoreButton
                        onClick={() =>
                          setAllVisible((value) => value + PAGE_SIZE)
                        }
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="collections" className="mt-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Label htmlFor="collection-slug">Slug:</Label>
                      <Select
                        value={selectedSlug}
                        disabled={entryOperation !== null}
                        onValueChange={(value) => {
                          if (typeof value !== 'string') return

                          setSelectedSlug(value)
                          setCollectionsVisible(PAGE_SIZE)
                        }}
                      >
                        <SelectTrigger
                          id="collection-slug"
                          className="min-w-48"
                        >
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
                      <Button
                        disabled={entryOperation !== null}
                        onClick={() => setAdding(true)}
                      >
                        <Plus />
                        Add {selectedSlug} entry
                      </Button>
                    </div>
                    <div className="mt-6">
                      <EntryList
                        entries={collectionsForSlug.slice(
                          0,
                          collectionsVisible,
                        )}
                        loading={entries === undefined}
                        disabled={entryOperation !== null}
                        onOpen={openEntry}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                        emptyState={
                          <Empty className="border">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <Layers />
                              </EmptyMedia>
                              <EmptyTitle>
                                No entries in {selectedSlug}
                              </EmptyTitle>
                              <EmptyDescription>
                                Create the first entry in this collection to get
                                started.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        }
                      />
                      {collectionsForSlug.length > collectionsVisible && (
                        <LoadMoreButton
                          onClick={() =>
                            setCollectionsVisible((value) => value + PAGE_SIZE)
                          }
                        />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="globals" className="mt-6">
                    <SearchBox
                      value={globalsQuery}
                      onChange={(value) => {
                        setGlobalsQuery(value)
                        setGlobalsVisible(PAGE_SIZE)
                      }}
                      placeholder="Search globals..."
                    />
                    <EntryList
                      entries={globalsFiltered.slice(0, globalsVisible)}
                      loading={entries === undefined}
                      disabled={entryOperation !== null}
                      onOpen={openEntry}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      emptyState={
                        <Empty className="border">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Bookmark />
                            </EmptyMedia>
                            <EmptyTitle>No globals</EmptyTitle>
                            <EmptyDescription>
                              No global entries match your search.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      }
                    />
                    {globalsFiltered.length > globalsVisible && (
                      <LoadMoreButton
                        onClick={() =>
                          setGlobalsVisible((value) => value + PAGE_SIZE)
                        }
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </Authenticated>
        </Container>
      </main>

      <Dialog
        open={editing !== null}
        onOpenChange={(open: boolean) => {
          if (!open && entryOperation !== 'rename') setEditing(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename entry</DialogTitle>
            <DialogDescription>
              Change the name of this collection entry.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={editName}
              disabled={entryOperation === 'rename'}
              onChange={(event) => setEditName(event.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={entryOperation === 'rename'}
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!editName.trim() || entryOperation === 'rename'}
            >
              {entryOperation === 'rename' ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={adding}
        onOpenChange={(open: boolean) => {
          if (entryOperation === 'add') return

          setAdding(open)
          if (!open) setNewName('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to {selectedSlug}</DialogTitle>
            <DialogDescription>
              Create a new entry in the {selectedSlug} collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-name">Name</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>/{selectedSlug}/</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="new-name"
                value={newName}
                disabled={entryOperation === 'add'}
                onChange={(event) =>
                  setNewName(event.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                }
                placeholder="entry-name"
                autoFocus
              />
            </InputGroup>
            <p className="text-muted-foreground text-xs">
              Only letters, numbers, dashes (-) and underscores (_) are allowed.
              No spaces or special characters.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={entryOperation === 'add'}
              onClick={() => {
                setAdding(false)
                setNewName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addCollectionEntry}
              disabled={!newName.trim() || entryOperation === 'add'}
            >
              {entryOperation === 'add' ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open: boolean) => {
          if (!open && entryOperation !== 'delete') setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete entry</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget ? entryPath(deleteTarget) : 'this entry'}?
              This removes the entry and its sections from the current version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={entryOperation === 'delete'}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={entryOperation === 'delete'}
              onClick={() => {
                if (deleteTarget) void deleteEntry(deleteTarget)
              }}
            >
              {entryOperation === 'delete' ? (
                <Loader2 className="animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const LoadingState = () => (
  <div className="text-muted-foreground flex items-center gap-2 text-sm">
    <Loader2 className="size-4 animate-spin" />
    Loading entries
  </div>
)

const LoadMoreButton = ({ onClick }: { onClick: () => void }) => (
  <div className="mt-4 flex justify-center">
    <Button variant="outline" onClick={onClick}>
      Load more
    </Button>
  </div>
)

function SearchBox({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoFocus?: boolean
}) {
  return (
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
}

function EntryList({
  entries,
  loading,
  disabled,
  onOpen,
  onEdit,
  onDelete,
  emptyState,
}: {
  entries: Entry[]
  loading: boolean
  disabled: boolean
  onOpen: (entry: Entry) => void
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
  emptyState?: React.ReactNode
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rowRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const openRefs = React.useRef<
    Array<HTMLAnchorElement | HTMLButtonElement | null>
  >([])
  const activeEntryIndex =
    entries.length === 0 ? 0 : Math.min(activeIndex, entries.length - 1)

  React.useEffect(() => {
    rowRefs.current.length = entries.length
    openRefs.current.length = entries.length
  }, [entries.length])

  const focusRow = (index: number) => {
    if (index < 0 || index >= entries.length) return

    setActiveIndex(index)
    rowRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusRow(Math.min(activeEntryIndex + 1, entries.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusRow(Math.max(activeEntryIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusRow(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusRow(entries.length - 1)
    } else if (event.key === 'Enter') {
      if (document.activeElement === rowRefs.current[activeEntryIndex]) {
        event.preventDefault()
        openRefs.current[activeEntryIndex]?.click()
      }
    }
  }

  if (loading) return <LoadingState />

  if (entries.length === 0) {
    return (
      <>
        {emptyState ?? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox />
              </EmptyMedia>
              <EmptyTitle>No entries</EmptyTitle>
              <EmptyDescription>
                There is nothing to show here yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </>
    )
  }

  return (
    <ItemGroup
      role="listbox"
      aria-label="Entries"
      aria-activedescendant={`admin-entry-${entries[activeEntryIndex]?.id ?? ''}`}
      aria-busy={disabled}
      onKeyDown={handleKeyDown}
    >
      {entries.map((entry, index) => {
        const isGlobal = entry.name === null
        const isActive = activeEntryIndex === index

        return (
          <div
            key={entry.id}
            ref={(element) => {
              rowRefs.current[index] = element
            }}
            id={`admin-entry-${entry.id}`}
            role="option"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
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
                  {entry.virtual ? (
                    <button
                      ref={(element) => {
                        openRefs.current[index] = element
                      }}
                      type="button"
                      disabled={disabled}
                      tabIndex={isActive ? 0 : -1}
                      className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                      onClick={() => onOpen(entry)}
                    >
                      {entryPath(entry)}
                    </button>
                  ) : (
                    <Link
                      ref={(element) => {
                        openRefs.current[index] = element
                      }}
                      href={entryHref(entry)}
                      tabIndex={isActive ? 0 : -1}
                      aria-disabled={disabled}
                      className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
                    >
                      {entryPath(entry)}
                    </Link>
                  )}
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
                          tabIndex={isActive ? 0 : -1}
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
}
