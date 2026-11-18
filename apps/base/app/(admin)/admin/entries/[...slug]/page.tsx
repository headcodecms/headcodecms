'use client'

import {
  ArrowDown,
  ArrowUp,
  Blocks,
  Bookmark,
  ChevronRight,
  Copy,
  GripVertical,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Reorder, useDragControls } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { z } from 'zod'

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
import type { Fields, HeadcodeSectionConfig } from '@/headcode/types'
import { cn } from '@/lib/utils'
import {
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../../../_components/admin-ui'
import { AdminShell } from '../../../_components/chrome'
import { AdminRichtextEditor as RichtextField } from '../../../_components/richtext-editor'
import { mutate, useQuery, type Entry } from '../../../_lib/api'
import { entryConfig, parseSlug } from '../../../_lib/entries'
import { useActions } from '../../../_lib/use-actions'

type SectionConfig = HeadcodeSectionConfig
type Section = { id: string; name: string; data: unknown }
type Item = Record<string, unknown>
type LinkFieldValue = { title: string; url: string; openInNewWindow: boolean }

// The field config of version 2's admin, read from a Zod field's meta
// (headcode/fields.ts). A list has the fields of its items.
type FieldConfig = {
  type?: string
  label: string
  description?: string
  options?: { label: string; value: string }[]
  itemFields?: Fields
}

const fieldConfig = (name: string, field: z.ZodType): FieldConfig => {
  const meta = (field.meta() ?? {}) as {
    field?: string
    title?: string
    description?: string
    options?: { label: string; value: string }[]
  }
  const array = field instanceof z.ZodDefault ? field.unwrap() : field
  return {
    type: meta.field,
    label: meta.title ?? name,
    description: meta.description,
    options: meta.options,
    itemFields:
      meta.field === 'list' &&
      array instanceof z.ZodArray &&
      array.element instanceof z.ZodObject
        ? (array.element.shape as Fields)
        : undefined,
  }
}

const isList = (name: string, field: z.ZodType) =>
  fieldConfig(name, field).type === 'list'

// Data with every field at its default.
const defaultData = (fields: Fields) => z.object(fields).parse({}) as Item
type Step = {
  fieldName: string
  label: string
  index: number
  itemFields: Fields
}

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

const mapFields = (
  fields: Fields,
  fn: (name: string, field: z.ZodType) => unknown,
) =>
  Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, fn(name, field)]),
  )

const normalizeData = (data: Item, fields: Fields): Item =>
  mapFields(fields, (name, field) => {
    const itemFields = fieldConfig(name, field).itemFields
    return itemFields
      ? getItems(data[name]).map((item) => normalizeData(item, itemFields))
      : data[name]
  })

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
    if (field && fieldConfig(name, field).type === 'link') {
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
    .filter(([name, field]) => isList(name, field))
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

const newId = () => crypto.randomUUID()

export default function EntryEditPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const slug = React.use(params).slug.map(decodeURIComponent).join('/')
  const { type, name } = parseSlug(slug)
  const isGlobal = name === null
  const router = useRouter()
  const entryQuery = useQuery<Entry>('entry_get', { slug, version: 'draft' })
  const config = entryConfig(slug)
  // A global missing in the draft starts from its defaults; the first change
  // saves it.
  const [defaults] = React.useState(() =>
    (config?.defaults ?? []).map((section) => ({ ...section, id: newId() })),
  )
  const missing = entryQuery.error?.startsWith('No entry ') ?? false
  const sections = entryQuery.data
    ? (entryQuery.data.sections as Section[])
    : missing && isGlobal && config
      ? defaults
      : undefined

  const sectionConfigs = config?.sections ?? []
  const configFor = (name: string) =>
    sectionConfigs.find((config) => config.name === name)

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Section | null>(null)
  const { pending, error, run } = useActions<
    'add' | 'delete' | 'duplicate' | 'reorder'
  >()
  const editingSection = sections?.find((section) => section.id === editingId)
  const busy = pending.length > 0
  const deleting = pending.includes('delete')

  // Every change saves the whole entry to the draft and shows the saved state.
  const save = async (next: Section[]) =>
    entryQuery.set(
      await mutate<Entry>('entry_update', { slug, sections: next }),
    )

  const handleAdd = (config: SectionConfig) => {
    const section = {
      id: newId(),
      name: config.name,
      data: defaultData(config.fields),
    }
    return run(
      'add',
      async () => {
        await save([...(sections ?? []), section])
        setEditingId(section.id)
      },
      'Could not add section.',
    )
  }

  const handleDelete = (section: Section) =>
    run(
      'delete',
      async () => {
        await save((sections ?? []).filter(({ id }) => id !== section.id))
        if (editingId === section.id) setEditingId(null)
        setDeleteTarget(null)
      },
      'Could not delete section.',
    )

  const handleDuplicate = (section: Section) =>
    run(
      'duplicate',
      () =>
        save(
          (sections ?? []).flatMap((current) =>
            current.id === section.id
              ? [current, { ...current, id: newId() }]
              : [current],
          ),
        ),
      'Could not duplicate section.',
    )

  const handleReorder = (ordered: Section[]) =>
    run('reorder', () => save(ordered), 'Could not reorder sections.')

  const handleSaveSection = (section: Section, data: Item) =>
    save(
      (sections ?? []).map((current) =>
        current.id === section.id ? { ...current, data } : current,
      ),
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
    <AdminShell
      dialogs={
        <>
          <DialogStack
            open={editingSection !== undefined}
            onOpenChange={(open) => {
              if (!open) setEditingId(null)
            }}
          >
            {editingSection ? (
              <SectionEditor
                key={editingSection.id}
                section={editingSection}
                config={configFor(editingSection.name)}
                slug={type}
                name={name}
                isGlobal={isGlobal}
                onSave={(data) => handleSaveSection(editingSection, data)}
                onClose={() => setEditingId(null)}
              />
            ) : null}
          </DialogStack>
          <ConfirmDialog
            open={deleteTarget !== null}
            onClose={() => setDeleteTarget(null)}
            pending={deleting}
            title="Delete section"
            description={
              <>
                Delete{' '}
                {deleteTarget
                  ? sectionTitle(deleteTarget, configFor(deleteTarget.name))
                  : 'this section'}
                ? This removes the section and its field content from the
                current entry.
              </>
            }
            confirmLabel="Delete"
            confirmVariant="destructive"
            onConfirm={() => deleteTarget && void handleDelete(deleteTarget)}
          />
        </>
      }
    >
      {sections === undefined ? (
        <Card>
          <CardContent>
            {missing ? (
              <EmptyState
                icon={<Blocks />}
                title="Entry not found"
                action={
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin')}
                  >
                    Back to entries
                  </Button>
                }
              >
                This entry is no longer available.
              </EmptyState>
            ) : entryQuery.error ? (
              <ErrorAlert error={entryQuery.error} />
            ) : (
              <LoadingState>Loading sections</LoadingState>
            )}
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
              {type}
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
                <EmptyState
                  icon={<Blocks />}
                  title="No sections yet"
                  action={
                    <>
                      <ErrorAlert error={error} />
                      {addButton}
                    </>
                  }
                >
                  Add your first section to start composing this entry.
                </EmptyState>
              ) : (
                <>
                  <SectionList
                    key={slug}
                    sections={sections}
                    configFor={configFor}
                    disabled={busy}
                    onReorder={handleReorder}
                    onEdit={(section) => setEditingId(section.id)}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeleteTarget}
                  />
                  <ErrorAlert error={error} className="mt-4" />
                  <div className="mt-6 flex justify-start">{addButton}</div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminShell>
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
      dragOrder.every((section, index) => section.id === sections[index]?.id)
    ) {
      setDragOrder(null)
      return
    }
    const activeSection = visible[listbox.active]
    setReordering(true)
    try {
      await onReorder(dragOrder)
      const nextIndex = dragOrder.findIndex(
        (section) => section.id === activeSection?.id,
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
      aria-activedescendant={`admin-section-${visible[listbox.active]?.id ?? ''}`}
      onKeyDown={listbox.onKeyDown}
      aria-busy={reordering || actions.disabled}
      className="flex w-full list-none flex-col gap-2.5 p-0"
    >
      {visible.map((section, index) => (
        <SectionRow
          key={section.id}
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
      id={`admin-section-${section.id}`}
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
  onSave,
  onClose,
}: {
  section: Section
  config?: SectionConfig
  slug: string
  name: string | null
  isGlobal: boolean
  onSave: (data: Item) => Promise<void>
  onClose: () => void
}) => {
  const [formData, setFormData] = React.useState(() =>
    normalizeData(
      isRecord(section.data) ? section.data : {},
      config?.fields ?? {},
    ),
  )
  const [initialJson] = React.useState(() => JSON.stringify(formData))
  const [activePath, setActivePath] = React.useState<Step[]>([])
  const { pending, error, run } = useActions<'save'>()
  const saving = pending.length > 0
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

  const handleSave = () =>
    run(
      'save',
      async () => {
        await onSave(formData)
        onClose()
      },
      'Could not save section.',
    )

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
          <span>{step.label}</span>
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
        field={fieldConfig(fieldName, field)}
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
              <DialogStackPrevious
                render={<Button variant="outline" onClick={closeLayer} />}
              >
                Close
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
              <DialogStackPrevious
                render={
                  <button
                    ref={previousLayerRef}
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sr-only"
                    onClick={closeLayer}
                  />
                }
              >
                Close layer
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
              <ErrorAlert error={error} />
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
  field: FieldConfig
  value: unknown
  path: Step[]
  ops: Ops
}

const FieldEditor = ({ name, field, value, path, ops }: FieldEditorProps) => {
  if (field.itemFields) {
    return (
      <ArrayFieldEditor
        name={name}
        field={field}
        itemFields={field.itemFields}
        value={value}
        path={path}
        ops={ops}
      />
    )
  }

  const label = field.label
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
      return (
        <UnsupportedField
          label={label}
          name={name}
          description="Images follow in a later step"
        />
      )
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
  itemFields,
  value,
  path,
  ops,
}: FieldEditorProps & { itemFields: Fields }) => {
  const label = field.label
  const items = getItems(value)
  const listbox = useListbox(items.length)

  const idPrefix = `array-item-${path.map((step) => `${step.fieldName}-${step.index}`).join('-')}-${name}-`

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {field.description ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
      <div className="flex flex-col gap-2">
        {items.length > 0 ? (
          <ul
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${idPrefix}${listbox.active}`}
            onKeyDown={listbox.onKeyDown}
            className="flex w-full list-none flex-col gap-2 p-0"
          >
            {items.map((item, index) => {
              const description = getItemDescription(item, itemFields)
              const edit = () =>
                ops.drill(path, { fieldName: name, label, index, itemFields })
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
                  <GripVertical className="text-muted-foreground m-1 size-4 shrink-0 self-center" />

                  <DialogStackNext
                    render={
                      <button
                        ref={listbox.openRef(index)}
                        type="button"
                        tabIndex={-1}
                        onClick={edit}
                        className="focus-visible:ring-ring flex flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:outline-none"
                      />
                    }
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
                        <DialogStackNext
                          render={<DropdownMenuItem onClick={edit} />}
                        >
                          <Pencil />
                          Edit
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
                defaultData(itemFields),
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
