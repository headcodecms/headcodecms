'use client'

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  Bookmark,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  GripVertical,
  Layers,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  DialogStack,
  DialogStackBody,
  DialogStackContent,
  DialogStackDescription,
  DialogStackFooter,
  DialogStackHeader,
  DialogStackNext,
  DialogStackOverlay,
  DialogStackPrevious,
  DialogStackTitle,
} from '@/components/kibo-ui/dialog-stack'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { headcodeConfig } from '@/headcode/config'
import type {
  HeadcodeFieldConfig,
  HeadcodeSectionConfig,
  ImageFieldValue,
  LinkFieldValue,
  ServiceSection as Section,
} from '@/headcode/types'
import { cn } from '@/lib/utils'
import { ImageField } from '../../../_fields/image-field'
import { RichtextField } from '../../../_fields/richtext-field'
import { AdminHeader } from '../../../_components/chrome'
import { Container } from '../../../_components/container'
import { useAdminHeadcodeVersion } from '../../../_lib/headcode'
import { errorMessage } from '../../../_lib/use-actions'

type SectionConfig = HeadcodeSectionConfig & {
  label?: string
  description?: string
}
type Fields = Record<string, HeadcodeFieldConfig>
type Item = Record<string, unknown>
type Step = { fieldName: string; index: number; itemFields: Fields }

// Form data operations, addressed by the path of drilled-into array items.
type Ops = {
  setField: (path: Step[], name: string, value: unknown) => void
  setItems: (
    path: Step[],
    name: string,
    update: (items: Item[]) => Item[],
  ) => void
  deleteItem: (path: Step[], name: string, index: number) => void
  drill: (path: Step[], step: Step) => void
}

const MAX_ARRAY_DEPTH = 4

const sectionTitle = (section: Section, config?: SectionConfig) =>
  config?.label ?? section.name

const isRecord = (value: unknown): value is Item =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const str = (value: unknown) => (typeof value === 'string' ? value : '')

const getItems = (value: unknown): Item[] =>
  Array.isArray(value) ? value.filter(isRecord) : []

const getLinkValue = (value: unknown): LinkFieldValue => {
  const link = isRecord(value) ? value : {}
  return {
    title: str(link.title),
    url: str(link.url),
    openInNewWindow: link.openInNewWindow === true,
  }
}

// Hydrated sections contain the image record; the form stores { imageId }.
const getImageValue = (value: unknown): ImageFieldValue => {
  const imageId = isRecord(value) ? (value.imageId ?? value._id) : null
  return typeof imageId === 'string'
    ? { imageId: imageId as Id<'images'> }
    : null
}

const getDefaultValue = (field: HeadcodeFieldConfig): unknown => {
  if (Array.isArray(field)) return []
  if ('defaultValue' in field) return field.defaultValue
  if (field.type === 'checkbox') return false
  if (field.type === 'link') return getLinkValue(null)
  if (field.type === 'image') return null
  return ''
}

const mapFields = (
  fields: Fields,
  fn: (name: string, field: HeadcodeFieldConfig) => unknown,
) =>
  Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, fn(name, field)]),
  )

const normalizeData = (data: Item, fields: Fields): Item =>
  mapFields(fields, (name, field) =>
    Array.isArray(field)
      ? getItems(data[name]).map((item) => normalizeData(item, field[0] ?? {}))
      : field.type === 'image'
        ? getImageValue(data[name])
        : data[name],
  )

const getPathItem = (data: Item, path: Step[]) =>
  path.reduce<Item | null>(
    (item, step) =>
      item && (getItems(item[step.fieldName])[step.index] ?? null),
    data,
  )

const updateAtPath = (
  data: Item,
  [step, ...rest]: Step[],
  update: (item: Item) => Item,
): Item =>
  step
    ? {
        ...data,
        [step.fieldName]: getItems(data[step.fieldName]).map((item, index) =>
          index === step.index ? updateAtPath(item, rest, update) : item,
        ),
      }
    : update(data)

const moveItem = (items: Item[], index: number, direction: -1 | 1) => {
  const to = index + direction
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  next.splice(to, 0, ...next.splice(index, 1))
  return next
}

const getItemTitle = (item: Item, fields: Fields, index: number) => {
  const preferred = ['title', 'name', 'label', 'value', 'filename']
  const names = Object.keys(fields)
  for (const name of [
    ...preferred.filter((name) => names.includes(name)),
    ...names.filter((name) => !preferred.includes(name)),
  ]) {
    const field = fields[name]
    if (field && !Array.isArray(field) && field.type === 'link') {
      const link = getLinkValue(item[name])
      if (link.title || link.url) return link.title || link.url
    }
    const value = item[name]
    if (typeof value === 'string' && value.trim()) return value
  }
  return `Item ${index + 1}`
}

const getItemDescription = (item: Item, fields: Fields) => {
  const count = Object.entries(fields)
    .filter(([, field]) => Array.isArray(field))
    .reduce((total, [name]) => total + getItems(item[name]).length, 0)
  if (count > 0) return `${count} nested item${count === 1 ? '' : 's'}`
  return typeof item.description === 'string' && item.description.trim()
    ? item.description
    : null
}

// Roving focus for a listbox of rows; Enter clicks the row's open button.
const useListbox = (count: number) => {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rowRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const openRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const active = Math.max(0, Math.min(activeIndex, count - 1))

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const focused = rowRefs.current.findIndex(
      (row) => row === document.activeElement,
    )
    const current = focused >= 0 ? focused : active
    const target = (
      {
        ArrowDown: Math.min(current + 1, count - 1),
        ArrowUp: Math.max(current - 1, 0),
        Home: 0,
        End: count - 1,
      } as Record<string, number | undefined>
    )[event.key]

    if (target !== undefined) {
      event.preventDefault()
      if (target < 0 || target >= count) return
      setActiveIndex(target)
      rowRefs.current[target]?.focus()
    } else if (
      event.key === 'Enter' &&
      (document.activeElement === event.currentTarget ||
        document.activeElement === rowRefs.current[current])
    ) {
      event.preventDefault()
      openRefs.current[current]?.click()
    }
  }

  const rowProps = (index: number) => ({
    ref: (element: HTMLLIElement | null) => {
      rowRefs.current[index] = element
    },
    role: 'option' as const,
    'aria-selected': active === index,
    tabIndex: active === index ? 0 : -1,
    onFocus: () => setActiveIndex(index),
  })

  const openRef = (index: number) => (element: HTMLButtonElement | null) => {
    openRefs.current[index] = element
  }

  return { active, setActiveIndex, rowRefs, onKeyDown, rowProps, openRef }
}

const Separator = () => <ChevronRight className="size-3.5 opacity-60" />

const HomeLink = ({ isGlobal }: { isGlobal: boolean }) => (
  <Link
    href="/admin"
    aria-label="Back to entries"
    className="hover:text-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
  >
    {isGlobal ? (
      <Bookmark className="size-4" aria-label="Globals" />
    ) : (
      <Layers className="size-4" aria-label="Collection" />
    )}
  </Link>
)

const LoadingSections = () => (
  <div className="text-muted-foreground flex items-center gap-2 text-sm">
    <ChevronsUpDown className="size-4 animate-pulse" />
    Loading sections
  </div>
)

export default function EntryEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const entryId = id as Id<'entries'>
  const router = useRouter()
  const searchParams = useSearchParams()
  const { version, resolved: versionResolved } = useAdminHeadcodeVersion()
  const entry = useQuery(api.services.getEntry, { id: entryId })
  const queriedSections = useQuery(api.services.getSections, { id: entryId })
  const addSection = useMutation(api.services.addSection)
  const deleteSection = useMutation(api.services.deleteSection)
  const duplicateSection = useMutation(api.services.duplicateSection)
  const reorderSections = useMutation(api.services.reorderSections)

  // Sections come sorted by pos from the server.
  const sections = (queriedSections ?? []) as Section[]
  const entryConfig = entry
    ? (entry.name ? headcodeConfig.collections : headcodeConfig.globals).find(
        (config) => config.slug === entry.slug,
      )
    : undefined
  const sectionConfigs = (entryConfig?.sections ?? []) as SectionConfig[]
  const configFor = (name: string) =>
    sectionConfigs.find((config) => config.name === name)

  const [editingId, setEditingId] = React.useState<Id<'sections'> | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Section | null>(null)
  const [operation, setOperation] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const consumedSectionParamRef = React.useRef<string | null>(null)
  const editingSection = sections.find((section) => section._id === editingId)
  const busy = operation !== null
  const deleting = operation === 'delete'

  const slug = entry?.slug ?? searchParams.get('slug') ?? id
  const name = entry?.name ?? searchParams.get('name')
  const isGlobal = entry ? entry.name === null : !searchParams.get('name')
  const sectionParam = searchParams.get('section')

  React.useEffect(() => {
    if (
      !sectionParam ||
      consumedSectionParamRef.current === sectionParam ||
      !queriedSections?.some((section) => section?._id === sectionParam)
    ) {
      return
    }
    consumedSectionParamRef.current = sectionParam
    setEditingId(sectionParam as Id<'sections'>)
  }, [sectionParam, queriedSections])

  const run = async (
    op: string,
    action: () => Promise<unknown>,
    fallback: string,
  ) => {
    setOperation(op)
    setError(null)
    try {
      await action()
    } catch (actionError) {
      setError(errorMessage(actionError, fallback))
    } finally {
      setOperation(null)
    }
  }

  const handleAdd = (config: SectionConfig) =>
    run(
      'add',
      async () =>
        setEditingId(
          await addSection({
            name: config.name,
            pos:
              sections.reduce(
                (max, section) => (section.pos > max ? section.pos : max),
                BigInt(0),
              ) + BigInt(100),
            entry: entryId,
            data: JSON.stringify({}),
          }),
        ),
      'Could not add section.',
    )

  const handleDelete = (section: Section) =>
    run(
      'delete',
      async () => {
        await deleteSection({ id: section._id })
        if (editingId === section._id) setEditingId(null)
        setDeleteTarget(null)
      },
      'Could not delete section.',
    )

  const handleDuplicate = (section: Section) =>
    run(
      'duplicate',
      () => duplicateSection({ id: section._id }),
      'Could not duplicate section.',
    )

  const handleReorder = (ordered: Section[]) =>
    run(
      'reorder',
      () =>
        reorderSections({
          sections: ordered.map((section, index) => ({
            id: section._id,
            pos: BigInt((index + 1) * 100),
          })),
        }),
      'Could not reorder sections.',
    )

  const addButton = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button disabled={busy}>
            <Plus />
            Add section
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-72">
        {sectionConfigs.map((config) => (
          <DropdownMenuItem
            key={config.name}
            disabled={busy}
            onClick={() => void handleAdd(config)}
          >
            <Blocks />
            <span className="grid gap-0.5">
              <span>{config.label ?? config.name}</span>
              {config.description ? (
                <span className="text-muted-foreground line-clamp-2 text-xs font-normal">
                  {config.description}
                </span>
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="min-h-svh">
      <AdminHeader version={version} versionResolved={versionResolved} />
      <Container className="py-8">
        <Authenticated>
          {entry === undefined || queriedSections === undefined ? (
            <Card>
              <CardContent>
                <LoadingSections />
              </CardContent>
            </Card>
          ) : entry === null ? (
            <Card>
              <CardContent>
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Blocks />
                    </EmptyMedia>
                    <EmptyTitle>Entry not found</EmptyTitle>
                    <EmptyDescription>
                      This entry is no longer available.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/admin')}
                    >
                      Back to entries
                    </Button>
                  </EmptyContent>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <>
              <nav
                aria-label="Breadcrumb"
                className="text-muted-foreground mb-4 flex items-center gap-2 text-sm"
              >
                <HomeLink isGlobal={isGlobal} />
                <Separator />
                <Link href="/admin" className="hover:text-foreground font-mono">
                  {slug}
                </Link>
                {name ? (
                  <>
                    <Separator />
                    <span className="text-foreground">{name}</span>
                  </>
                ) : null}
              </nav>

              <Card>
                <CardContent>
                  {sections.length === 0 ? (
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Blocks />
                        </EmptyMedia>
                        <EmptyTitle>No sections yet</EmptyTitle>
                        <EmptyDescription>
                          Add your first section to start composing this entry.
                        </EmptyDescription>
                      </EmptyHeader>
                      {error ? (
                        <p role="alert" className="text-destructive text-sm">
                          {error}
                        </p>
                      ) : null}
                      <EmptyContent>{addButton}</EmptyContent>
                    </Empty>
                  ) : (
                    <>
                      <SectionList
                        key={entry._id}
                        sections={sections}
                        configFor={configFor}
                        disabled={busy}
                        onReorder={handleReorder}
                        onEdit={(section) => setEditingId(section._id)}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteTarget}
                      />
                      {error ? (
                        <p
                          role="alert"
                          className="text-destructive mt-4 text-sm"
                        >
                          {error}
                        </p>
                      ) : null}
                      <div className="mt-6 flex justify-start">{addButton}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Authenticated>
        <AuthLoading>
          <LoadingSections />
        </AuthLoading>
        <Unauthenticated>
          <p className="text-muted-foreground text-sm">Signing in...</p>
        </Unauthenticated>
      </Container>

      <DialogStack
        open={editingSection !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditingId(null)
        }}
      >
        {editingSection ? (
          <SectionEditor
            key={editingSection._id}
            section={editingSection}
            config={configFor(editingSection.name)}
            slug={slug}
            name={name}
            isGlobal={isGlobal}
            onClose={() => setEditingId(null)}
          />
        ) : null}
      </DialogStack>
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete section</DialogTitle>
            <DialogDescription>
              Delete{' '}
              {deleteTarget
                ? sectionTitle(deleteTarget, configFor(deleteTarget.name))
                : 'this section'}
              ? This removes the section and its field content from the current
              entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && void handleDelete(deleteTarget)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type SectionActions = {
  disabled: boolean
  onEdit: (section: Section) => void
  onDuplicate: (section: Section) => Promise<void>
  onDelete: (section: Section) => void
}

const SectionList = ({
  sections,
  configFor,
  onReorder,
  ...actions
}: SectionActions & {
  sections: Section[]
  configFor: (name: string) => SectionConfig | undefined
  onReorder: (sections: Section[]) => Promise<void>
}) => {
  const [dragOrder, setDragOrder] = React.useState<Section[] | null>(null)
  const [reordering, setReordering] = React.useState(false)
  const visible = dragOrder ?? sections
  const listbox = useListbox(visible.length)

  React.useEffect(() => {
    window.requestAnimationFrame(() => listbox.rowRefs.current[0]?.focus())
  }, [listbox.rowRefs])

  const startReorder = () => {
    if (!dragOrder) setDragOrder(visible)
  }

  const commitReorder = async () => {
    if (!dragOrder) return
    if (
      dragOrder.every((section, index) => section._id === sections[index]?._id)
    ) {
      setDragOrder(null)
      return
    }
    const activeSection = visible[listbox.active]
    setReordering(true)
    try {
      await onReorder(dragOrder)
      const nextIndex = dragOrder.findIndex(
        (section) => section._id === activeSection?._id,
      )
      if (nextIndex >= 0) listbox.setActiveIndex(nextIndex)
    } finally {
      setReordering(false)
      setDragOrder(null)
    }
  }

  return (
    <Reorder.Group
      axis="y"
      values={visible}
      onReorder={setDragOrder}
      role="listbox"
      aria-label="Sections"
      aria-activedescendant={`admin-section-${visible[listbox.active]?._id ?? ''}`}
      onKeyDown={listbox.onKeyDown}
      aria-busy={reordering || actions.disabled}
      className="flex w-full list-none flex-col gap-2.5 p-0"
    >
      {visible.map((section, index) => (
        <SectionRow
          key={section._id}
          {...actions}
          section={section}
          config={configFor(section.name)}
          isActive={listbox.active === index}
          rowProps={listbox.rowProps(index)}
          openRef={listbox.openRef(index)}
          locked={reordering || actions.disabled}
          onReorderStart={startReorder}
          onReorderEnd={() => void commitReorder()}
        />
      ))}
    </Reorder.Group>
  )
}

const SectionRow = ({
  section,
  config,
  isActive,
  rowProps,
  openRef,
  locked,
  disabled,
  onReorderStart,
  onReorderEnd,
  onEdit,
  onDuplicate,
  onDelete,
}: SectionActions & {
  section: Section
  config?: SectionConfig
  isActive: boolean
  rowProps: ReturnType<ReturnType<typeof useListbox>['rowProps']>
  openRef: (element: HTMLButtonElement | null) => void
  locked: boolean
  onReorderStart: () => void
  onReorderEnd: () => void
}) => {
  const controls = useDragControls()

  return (
    <Reorder.Item
      {...rowProps}
      value={section}
      dragListener={false}
      dragControls={controls}
      id={`admin-section-${section._id}`}
      onDragStart={onReorderStart}
      onDragEnd={onReorderEnd}
      className={cn(
        'group/item bg-muted/50 hover:bg-muted relative flex w-full flex-wrap items-center gap-3.5 rounded-2xl border border-transparent px-3.5 py-3 text-sm transition-colors outline-none',
        'focus-visible:ring-ring focus-visible:ring-2',
        isActive && 'ring-ring/30 ring-2',
        locked && 'pointer-events-none opacity-70',
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        tabIndex={-1}
        disabled={locked}
        onPointerDown={(event) => {
          event.preventDefault()
          onReorderStart()
          controls.start(event)
        }}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex shrink-0 cursor-grab touch-none items-center self-center rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <button
        ref={openRef}
        type="button"
        tabIndex={-1}
        onClick={() => onEdit(section)}
        className="flex flex-1 cursor-pointer items-center gap-3.5 rounded-md text-left outline-none"
      >
        <ItemContent>
          <ItemTitle>{sectionTitle(section, config)}</ItemTitle>
          <ItemDescription className="text-xs">{section.name}</ItemDescription>
        </ItemContent>
      </button>

      <ItemActions className="relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Actions"
                tabIndex={isActive ? 0 : -1}
              >
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(section)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onClick={() => void onDuplicate(section)}
            >
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={disabled}
              onClick={() => onDelete(section)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Reorder.Item>
  )
}

const SectionEditor = ({
  section,
  config,
  slug,
  name,
  isGlobal,
  onClose,
}: {
  section: Section
  config?: SectionConfig
  slug: string
  name: string | null
  isGlobal: boolean
  onClose: () => void
}) => {
  const updateSection = useMutation(api.services.updateSection)
  const [formData, setFormData] = React.useState(() =>
    normalizeData(
      isRecord(section.data) ? section.data : {},
      config?.fields ?? {},
    ),
  )
  const [initialJson] = React.useState(() => JSON.stringify(formData))
  const [activePath, setActivePath] = React.useState<Step[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false)
  const previousLayerRef = React.useRef<HTMLButtonElement | null>(null)
  const json = JSON.stringify(formData)
  const isDirty = json !== initialJson

  const closeOneLayer = () => {
    if (activePath.length > 0) previousLayerRef.current?.click()
    else if (isDirty) setConfirmDiscardOpen(true)
    else onClose()
  }

  // Escape closes one stack layer, unless a nested popup handles it.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        confirmDiscardOpen
      )
        return
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[data-slot="dialog-content"], [data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="select-content"]',
        )
      )
        return
      event.preventDefault()
      event.stopPropagation()
      closeOneLayer()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  React.useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const setItems: Ops['setItems'] = (path, fieldName, update) =>
    setFormData((current) =>
      updateAtPath(current, path, (item) => ({
        ...item,
        [fieldName]: update(getItems(item[fieldName])),
      })),
    )

  const ops: Ops = {
    setField: (path, fieldName, value) =>
      setFormData((current) =>
        updateAtPath(current, path, (item) => ({
          ...item,
          [fieldName]: value,
        })),
      ),
    setItems,
    deleteItem: (path, fieldName, index) => {
      setItems(path, fieldName, (items) => items.filter((_, i) => i !== index))
      // Close the layer of the deleted item if it is open.
      setActivePath((current) =>
        current[path.length]?.fieldName === fieldName &&
        current[path.length]?.index === index
          ? path
          : current,
      )
    },
    drill: (path, step) => setActivePath([...path, step]),
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateSection({
        id: section._id,
        name: section.name,
        pos: section.pos,
        data: json,
        entry: section.entry,
      })
      onClose()
    } catch (updateError) {
      setError(errorMessage(updateError, 'Could not save section.'))
    } finally {
      setSaving(false)
    }
  }

  const closeLayer = () => setActivePath((current) => current.slice(0, -1))

  const breadcrumb = (path: Step[]) => (
    <DialogStackDescription className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <HomeLink isGlobal={isGlobal} />
      <Separator />
      <span className="font-mono">{slug}</span>
      {name ? (
        <>
          <Separator />
          <span>{name}</span>
        </>
      ) : null}
      <Separator />
      <span className="font-mono">{section.name}</span>
      {path.map((step) => (
        <React.Fragment key={`${step.fieldName}-${step.index}`}>
          <Separator />
          <span>{step.fieldName}</span>
          <Separator />
          <span className="text-foreground font-mono">{step.index + 1}</span>
        </React.Fragment>
      ))}
    </DialogStackDescription>
  )

  const fields = (fieldConfigs: Fields, data: Item, path: Step[]) =>
    Object.entries(fieldConfigs).map(([fieldName, field]) => (
      <FieldEditor
        key={`${path.map((step) => `${step.fieldName}:${step.index}`).join('/')}/${fieldName}`}
        name={fieldName}
        field={field}
        value={data[fieldName]}
        path={path}
        ops={ops}
      />
    ))

  const layers = Array.from({ length: MAX_ARRAY_DEPTH }, (_, index) => {
    const path = activePath.slice(0, index + 1)
    const step = path[index]
    const item = step ? getPathItem(formData, path) : null

    return (
      <DialogStackContent key={index + 1} className="h-[80vh]">
        {item && step ? (
          <div className="flex h-full min-h-0 flex-col">
            <DialogStackHeader className="shrink-0 pb-6">
              <DialogStackTitle className="text-2xl">
                {getItemTitle(item, step.itemFields, step.index)}
              </DialogStackTitle>
              {breadcrumb(path)}
            </DialogStackHeader>
            <div className="-mx-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 outline-none">
              <FieldGroup>{fields(step.itemFields, item, path)}</FieldGroup>
            </div>
            <DialogStackFooter>
              <DialogStackPrevious asChild>
                <Button variant="outline" onClick={closeLayer}>
                  Close
                </Button>
              </DialogStackPrevious>
            </DialogStackFooter>
          </div>
        ) : null}
      </DialogStackContent>
    )
  })

  return (
    <>
      <DialogStackOverlay onClick={closeOneLayer} />
      <DialogStackBody className="max-w-4xl">
        {[
          <DialogStackContent key="section" className="h-[80vh]">
            <div className="flex h-full min-h-0 flex-col">
              <DialogStackPrevious asChild>
                <button
                  ref={previousLayerRef}
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                  onClick={closeLayer}
                >
                  Close layer
                </button>
              </DialogStackPrevious>
              <DialogStackHeader className="shrink-0 pb-6">
                <DialogStackTitle className="flex items-center gap-3 text-2xl">
                  <span>{sectionTitle(section, config)}</span>
                  {isDirty ? (
                    <span className="bg-muted text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium uppercase">
                      Unsaved
                    </span>
                  ) : null}
                </DialogStackTitle>
                {breadcrumb([])}
              </DialogStackHeader>
              <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 outline-none">
                {config?.description ? (
                  <p className="text-muted-foreground text-sm">
                    {config.description}
                  </p>
                ) : null}
                {Object.keys(config?.fields ?? {}).length > 0 ? (
                  <FieldGroup>
                    {fields(config?.fields ?? {}, formData, [])}
                  </FieldGroup>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This section has no editable fields.
                  </p>
                )}
              </div>
              {error ? (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              ) : null}
              <DialogStackFooter>
                <Button
                  variant="outline"
                  onClick={closeOneLayer}
                  disabled={saving}
                >
                  {isDirty ? 'Cancel' : 'Close'}
                </Button>
                <Button onClick={handleSave} disabled={saving || !isDirty}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </DialogStackFooter>
            </div>
          </DialogStackContent>,
          ...layers,
        ]}
      </DialogStackBody>
      <Dialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              This section has local edits that have not been saved yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDiscardOpen(false)}
            >
              Continue editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDiscardOpen(false)
                onClose()
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type FieldEditorProps = {
  name: string
  field: HeadcodeFieldConfig
  value: unknown
  path: Step[]
  ops: Ops
}

const FieldEditor = ({ name, field, value, path, ops }: FieldEditorProps) => {
  if (Array.isArray(field)) {
    return (
      <ArrayFieldEditor
        name={name}
        field={field}
        value={value}
        path={path}
        ops={ops}
      />
    )
  }

  const label = field.label ?? name
  const id = `field-${name}`
  const onChange = (next: unknown) => ops.setField(path, name, next)
  const description =
    typeof field.description === 'string' && field.description.trim() ? (
      <FieldDescription>{field.description}</FieldDescription>
    ) : null

  if (field.type === 'checkbox') {
    return (
      <Field orientation="horizontal">
        <Switch id={id} checked={value === true} onCheckedChange={onChange} />
        <FieldContent>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {description}
        </FieldContent>
      </Field>
    )
  }

  let control: React.ReactNode
  let htmlFor: string | undefined = id

  switch (field.type) {
    case 'text':
      control = (
        <Input
          id={id}
          value={str(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      )
      break
    case 'textarea':
      control = (
        <Textarea
          id={id}
          value={str(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      )
      break
    case 'richtext':
      htmlFor = undefined
      control = <RichtextField value={str(value)} onChange={onChange} />
      break
    case 'select':
      control = (
        <Select
          value={str(value)}
          onValueChange={(next) => {
            if (typeof next === 'string') onChange(next)
          }}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )
      break
    case 'link': {
      htmlFor = undefined
      const link = getLinkValue(value)
      const set = (patch: Partial<LinkFieldValue>) =>
        onChange({ ...link, ...patch })
      control = (
        <div className="bg-muted/30 rounded-2xl border p-3">
          <FieldGroup className="gap-4 @md/field-group:grid @md/field-group:grid-cols-2">
            <Field className="@md/field-group:col-span-1">
              <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
              <Input
                id={`${id}-title`}
                value={link.title}
                onChange={(event) => set({ title: event.target.value })}
              />
            </Field>
            <Field className="@md/field-group:col-span-1">
              <FieldLabel htmlFor={`${id}-url`}>URL</FieldLabel>
              <Input
                id={`${id}-url`}
                value={link.url}
                onChange={(event) => set({ url: event.target.value })}
              />
            </Field>
            <Field
              orientation="horizontal"
              className="@md/field-group:col-span-2"
            >
              <Switch
                id={`${id}-target`}
                checked={link.openInNewWindow}
                onCheckedChange={(checked) => set({ openInNewWindow: checked })}
              />
              <FieldContent>
                <FieldLabel htmlFor={`${id}-target`}>
                  Open in new window
                </FieldLabel>
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>
      )
      break
    }
    case 'image':
      htmlFor = undefined
      control = (
        <ImageField
          value={getImageValue(value)}
          accept={field.accept}
          maxSize={field.maxSize}
          onChange={onChange}
        />
      )
      break
    default:
      return (
        <UnsupportedField
          label={label}
          name={name}
          description={field.type ? `${field.type} field` : 'Unsupported field'}
        />
      )
  }

  return (
    <Field>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {control}
      {description}
    </Field>
  )
}

const ArrayFieldEditor = ({
  name,
  field,
  value,
  path,
  ops,
}: FieldEditorProps & { field: Fields[] }) => {
  const itemFields = field[0]
  const items = getItems(value)
  const listbox = useListbox(items.length)

  if (!itemFields) {
    return (
      <UnsupportedField
        label={name}
        name={name}
        description="Array has no item fields"
      />
    )
  }

  const idPrefix = `array-item-${path.map((step) => `${step.fieldName}-${step.index}`).join('-')}-${name}-`

  return (
    <Field>
      <FieldLabel>{name}</FieldLabel>
      <div className="flex flex-col gap-2">
        {items.length > 0 ? (
          <ul
            role="listbox"
            aria-label={name}
            aria-activedescendant={`${idPrefix}${listbox.active}`}
            onKeyDown={listbox.onKeyDown}
            className="flex w-full list-none flex-col gap-2 p-0"
          >
            {items.map((item, index) => {
              const description = getItemDescription(item, itemFields)
              const edit = () =>
                ops.drill(path, { fieldName: name, index, itemFields })
              const move = (direction: -1 | 1) =>
                ops.setItems(path, name, (current) =>
                  moveItem(current, index, direction),
                )

              return (
                <li
                  key={index}
                  {...listbox.rowProps(index)}
                  id={`${idPrefix}${index}`}
                  className={cn(
                    'group/item bg-muted/50 hover:bg-muted relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors outline-none',
                    'focus-visible:ring-ring focus-visible:ring-2',
                    listbox.active === index && 'ring-ring/30 ring-2',
                  )}
                >
                  <button
                    type="button"
                    aria-label="Move item"
                    tabIndex={-1}
                    className="text-muted-foreground flex shrink-0 cursor-grab touch-none items-center self-center rounded-md p-1"
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <DialogStackNext asChild>
                    <button
                      ref={listbox.openRef(index)}
                      type="button"
                      tabIndex={-1}
                      onClick={edit}
                      className="focus-visible:ring-ring flex flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <ItemContent>
                        <ItemTitle>
                          {getItemTitle(item, itemFields, index)}
                        </ItemTitle>
                        {description ? (
                          <ItemDescription className="text-xs">
                            {description}
                          </ItemDescription>
                        ) : null}
                      </ItemContent>
                    </button>
                  </DialogStackNext>

                  <ItemActions className="relative z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Actions"
                          >
                            <MoreVertical />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DialogStackNext asChild>
                          <DropdownMenuItem onClick={edit}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                        </DialogStackNext>
                        <DropdownMenuItem
                          disabled={index === 0}
                          onClick={() => move(-1)}
                        >
                          <ArrowUp />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === items.length - 1}
                          onClick={() => move(1)}
                        >
                          <ArrowDown />
                          Move down
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => ops.deleteItem(path, name, index)}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ItemActions>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="bg-muted/40 text-muted-foreground rounded-2xl px-3.5 py-3 text-sm">
            No items yet.
          </div>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              ops.setItems(path, name, (current) => [
                ...current,
                mapFields(itemFields, (_, itemField) =>
                  getDefaultValue(itemField),
                ),
              ])
            }
          >
            <Plus />
            Add item
          </Button>
        </div>
      </div>
    </Field>
  )
}

const UnsupportedField = ({
  label,
  name,
  description,
}: {
  label: string
  name: string
  description: string
}) => (
  <Field data-disabled="true">
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-sm">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="text-muted-foreground font-mono text-xs">{name}</div>
      </div>
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <Plus className="size-4" />
        {description}
      </span>
    </div>
  </Field>
)
