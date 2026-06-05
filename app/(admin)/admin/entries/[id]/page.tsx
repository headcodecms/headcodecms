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
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { headcodeConfig } from '@/headcode/config'
import type {
  HeadcodeFieldConfig,
  HeadcodeFieldType,
  ImageFieldValue,
  LinkFieldValue,
} from '@/headcode/types'
import { cn } from '@/lib/utils'
import { ImageField } from '../../../_fields/image-field'
import { RichtextField } from '../../../_fields/richtext-field'
import { AdminHeader } from '../../../_components/chrome'
import { Container } from '../../../_components/container'
import { useAdminHeadcodeVersion } from '../../../_lib/headcode'

type Section = Omit<Doc<'sections'>, 'data'> & {
  data: unknown
}

type SectionConfig = {
  name: string
  label?: string
  description?: string
  fields: Record<string, HeadcodeFieldConfig>
}

type SectionOperation = 'add' | 'duplicate' | 'delete' | 'reorder'

type ArrayItem = Record<string, unknown>

type ArrayItemPath = {
  fieldName: string
  fieldLabel: string
  index: number
  itemFields: Record<string, HeadcodeFieldConfig>
}

const MAX_ARRAY_DEPTH = 4

const getSectionTitle = (section: Section, config?: SectionConfig) =>
  config?.label ?? section.name

const getEntryConfig = (entry?: Doc<'entries'> | null) => {
  if (!entry) return null

  const configs = entry.name
    ? headcodeConfig.collections
    : headcodeConfig.globals

  return configs.find((config) => config.slug === entry.slug) ?? null
}

const getOrderedSections = (sections: Section[]) =>
  [...sections].sort((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0))

const getNextPos = (sections: Section[]) =>
  sections.reduce(
    (max, section) => (section.pos > max ? section.pos : max),
    BigInt(0),
  ) + BigInt(100)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getFieldLabel = (name: string, field: HeadcodeFieldConfig) =>
  Array.isArray(field) ? name : (field.label ?? name)

const getFieldDescription = (field: HeadcodeFieldConfig) => {
  if (Array.isArray(field)) return null
  return typeof field.description === 'string' && field.description.trim()
    ? field.description
    : null
}

const getFieldType = (field: HeadcodeFieldConfig): HeadcodeFieldType | null =>
  Array.isArray(field) ? null : (field.type ?? null)

const getArrayFieldConfig = (field: HeadcodeFieldConfig) =>
  Array.isArray(field) ? (field[0] ?? null) : null

const getArrayItems = (value: unknown): ArrayItem[] =>
  Array.isArray(value) ? value.filter(isRecord) : []

const serializeFormData = (data: Record<string, unknown>) =>
  JSON.stringify(data)

const getStringValue = (value: unknown) =>
  typeof value === 'string' ? value : ''

const getBooleanValue = (value: unknown) =>
  typeof value === 'boolean' ? value : false

const getLinkValue = (value: unknown): LinkFieldValue => {
  if (!isRecord(value)) {
    return { title: '', url: '', openInNewWindow: false }
  }

  return {
    title: getStringValue(value.title),
    url: getStringValue(value.url),
    openInNewWindow: getBooleanValue(value.openInNewWindow),
  }
}

const getImageValue = (value: unknown): ImageFieldValue => {
  if (!isRecord(value)) return null

  const imageId = value.imageId ?? value._id
  if (typeof imageId !== 'string') return null

  return { imageId: imageId as Id<'images'> }
}

const getDefaultFieldValue = (field: HeadcodeFieldConfig): unknown => {
  if (Array.isArray(field)) return []
  if ('defaultValue' in field) return field.defaultValue

  const type = getFieldType(field)

  if (type === 'checkbox') return false
  if (type === 'link') {
    return { title: '', url: '', openInNewWindow: false }
  }
  if (type === 'image') return null

  return ''
}

const createArrayItem = (
  fields: Record<string, HeadcodeFieldConfig>,
): ArrayItem =>
  Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [
      name,
      getDefaultFieldValue(field),
    ]),
  )

const normalizeFormValue = (
  field: HeadcodeFieldConfig,
  value: unknown,
): unknown => {
  if (Array.isArray(field)) {
    const itemFields = field[0] ?? {}
    if (!Array.isArray(value)) return []

    return value
      .filter(isRecord)
      .map((item) => normalizeFormData(item, itemFields))
  }

  if (getFieldType(field) === 'image') return getImageValue(value)

  return value
}

const normalizeFormData = (
  data: Record<string, unknown>,
  fields: Record<string, HeadcodeFieldConfig>,
) =>
  Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [
      name,
      normalizeFormValue(field, data[name]),
    ]),
  )

const getPathItem = (
  data: Record<string, unknown>,
  path: ArrayItemPath[],
): ArrayItem | null => {
  let current: Record<string, unknown> = data

  for (const step of path) {
    const item = getArrayItems(current[step.fieldName])[step.index]
    if (!item) return null
    current = item
  }

  return current
}

const updateItemAtPath = (
  data: Record<string, unknown>,
  path: ArrayItemPath[],
  updater: (item: ArrayItem) => ArrayItem,
): Record<string, unknown> => {
  if (path.length === 0) return data

  const updateNext = (
    container: Record<string, unknown>,
    [step, ...rest]: ArrayItemPath[],
  ): Record<string, unknown> => {
    const items = getArrayItems(container[step.fieldName])
    const nextItems = items.map((item, index) => {
      if (index !== step.index) return item
      if (rest.length === 0) return updater(item)
      return updateNext(item, rest)
    })

    return { ...container, [step.fieldName]: nextItems }
  }

  return updateNext(data, path)
}

const updateArrayAtPath = (
  data: Record<string, unknown>,
  path: ArrayItemPath[],
  fieldName: string,
  updater: (items: ArrayItem[]) => ArrayItem[],
): Record<string, unknown> => {
  if (path.length === 0) {
    return { ...data, [fieldName]: updater(getArrayItems(data[fieldName])) }
  }

  return updateItemAtPath(data, path, (item) => ({
    ...item,
    [fieldName]: updater(getArrayItems(item[fieldName])),
  }))
}

const moveArrayItem = (
  items: ArrayItem[],
  index: number,
  direction: -1 | 1,
) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items

  const next = [...items]
  const [item] = next.splice(index, 1)
  if (!item) return items
  next.splice(nextIndex, 0, item)

  return next
}

const getArrayItemTitle = (
  item: ArrayItem,
  fields: Record<string, HeadcodeFieldConfig>,
  index: number,
) => {
  const preferredKeys = ['title', 'name', 'label', 'value', 'filename']
  const fieldNames = Object.keys(fields)
  const sortedNames = [
    ...preferredKeys.filter((name) => fieldNames.includes(name)),
    ...fieldNames.filter((name) => !preferredKeys.includes(name)),
  ]

  for (const name of sortedNames) {
    const field = fields[name]
    const value = item[name]

    if (field && getFieldType(field) === 'link') {
      const link = getLinkValue(value)
      if (link.title) return link.title
      if (link.url) return link.url
    }

    if (typeof value === 'string' && value.trim()) return value
  }

  return `Item ${index + 1}`
}

const getArrayItemDescription = (
  item: ArrayItem,
  fields: Record<string, HeadcodeFieldConfig>,
) => {
  const arrayCounts = Object.entries(fields)
    .filter(([, field]) => Array.isArray(field))
    .map(([name]) => getArrayItems(item[name]).length)
    .filter((count) => count > 0)

  if (arrayCounts.length > 0) {
    const count = arrayCounts.reduce((total, count) => total + count, 0)
    return `${count} nested item${count === 1 ? '' : 's'}`
  }

  const description = item.description
  return typeof description === 'string' && description.trim()
    ? description
    : null
}

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

  const sections = getOrderedSections((queriedSections ?? []) as Section[])
  const entryConfig = getEntryConfig(entry)
  const sectionConfigs = (entryConfig?.sections ?? []) as SectionConfig[]
  const sectionConfigsByName = new Map(
    sectionConfigs.map((config) => [config.name, config]),
  )
  const [editingSectionId, setEditingSectionId] =
    React.useState<Id<'sections'> | null>(null)
  const consumedSectionParamRef = React.useRef<string | null>(null)
  const [deleteSectionTarget, setDeleteSectionTarget] =
    React.useState<Section | null>(null)
  const [sectionOperation, setSectionOperation] =
    React.useState<SectionOperation | null>(null)
  const [sectionError, setSectionError] = React.useState<string | null>(null)
  const editingSection = editingSectionId
    ? (sections.find((section) => section._id === editingSectionId) ?? null)
    : null
  const deleteSectionConfig = deleteSectionTarget
    ? sectionConfigsByName.get(deleteSectionTarget.name)
    : undefined

  const breadcrumbSlug = entry?.slug ?? searchParams.get('slug') ?? id
  const breadcrumbName = entry?.name ?? searchParams.get('name')
  const isGlobal = entry ? entry.name === null : !searchParams.get('name')
  const sectionParam = searchParams.get('section')

  React.useEffect(() => {
    if (
      !sectionParam ||
      consumedSectionParamRef.current === sectionParam ||
      !sections.some((section) => section._id === sectionParam)
    ) {
      return
    }

    consumedSectionParamRef.current = sectionParam
    setEditingSectionId(sectionParam as Id<'sections'>)
  }, [sectionParam, sections])

  const handleAddSection = async (sectionConfig: SectionConfig) => {
    setSectionOperation('add')
    setSectionError(null)

    try {
      const sectionId = await addSection({
        name: sectionConfig.name,
        pos: getNextPos(sections),
        entry: entryId,
        data: JSON.stringify({}),
      })
      setEditingSectionId(sectionId)
    } catch (addError) {
      setSectionError(
        addError instanceof Error ? addError.message : 'Could not add section.',
      )
    } finally {
      setSectionOperation(null)
    }
  }

  const handleDeleteSection = async (section: Section) => {
    setSectionOperation('delete')
    setSectionError(null)

    try {
      await deleteSection({ id: section._id })
      if (editingSectionId === section._id) setEditingSectionId(null)
      setDeleteSectionTarget(null)
    } catch (deleteError) {
      setSectionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete section.',
      )
    } finally {
      setSectionOperation(null)
    }
  }

  const handleDuplicateSection = async (section: Section) => {
    setSectionOperation('duplicate')
    setSectionError(null)

    try {
      await duplicateSection({ id: section._id })
    } catch (duplicateError) {
      setSectionError(
        duplicateError instanceof Error
          ? duplicateError.message
          : 'Could not duplicate section.',
      )
    } finally {
      setSectionOperation(null)
    }
  }

  const confirmDeleteSection = async () => {
    if (!deleteSectionTarget) return
    await handleDeleteSection(deleteSectionTarget)
  }

  const handleReorderSections = async (orderedSections: Section[]) => {
    setSectionOperation('reorder')
    setSectionError(null)

    try {
      await reorderSections({
        sections: orderedSections.map((section, index) => ({
          id: section._id,
          pos: BigInt((index + 1) * 100),
        })),
      })
    } catch (reorderError) {
      setSectionError(
        reorderError instanceof Error
          ? reorderError.message
          : 'Could not reorder sections.',
      )
    } finally {
      setSectionOperation(null)
    }
  }

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
            <EntrySections
              key={entry._id}
              breadcrumbSlug={breadcrumbSlug}
              breadcrumbName={breadcrumbName}
              isGlobal={isGlobal}
              sections={sections}
              sectionConfigs={sectionConfigs}
              sectionConfigsByName={sectionConfigsByName}
              sectionError={sectionError}
              sectionOperation={sectionOperation}
              onAddSection={handleAddSection}
              onEditSection={(section) => setEditingSectionId(section._id)}
              onDuplicateSection={handleDuplicateSection}
              onDeleteSection={setDeleteSectionTarget}
              onReorderSections={handleReorderSections}
            />
          )}
        </Authenticated>
        <AuthLoading>
          <LoadingSections />
        </AuthLoading>
        <Unauthenticated>
          <p className="text-muted-foreground text-sm">Signing in...</p>
        </Unauthenticated>
      </Container>

      <SectionShellDialog
        section={editingSection}
        config={
          editingSection
            ? sectionConfigsByName.get(editingSection.name)
            : undefined
        }
        slug={breadcrumbSlug}
        name={breadcrumbName}
        isGlobal={isGlobal}
        onOpenChange={(open) => {
          if (!open) setEditingSectionId(null)
        }}
      />
      <Dialog
        open={deleteSectionTarget !== null}
        onOpenChange={(open) => {
          if (!open && sectionOperation !== 'delete')
            setDeleteSectionTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete section</DialogTitle>
            <DialogDescription>
              Delete{' '}
              {deleteSectionTarget
                ? getSectionTitle(deleteSectionTarget, deleteSectionConfig)
                : 'this section'}
              ? This removes the section and its field content from the current
              entry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteSectionTarget(null)}
              disabled={sectionOperation === 'delete'}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeleteSection()}
              disabled={sectionOperation === 'delete'}
            >
              {sectionOperation === 'delete' ? (
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

const LoadingSections = () => (
  <div className="text-muted-foreground flex items-center gap-2 text-sm">
    <ChevronsUpDown className="size-4 animate-pulse" />
    Loading sections
  </div>
)

function EntrySections({
  breadcrumbSlug,
  breadcrumbName,
  isGlobal,
  sections,
  sectionConfigs,
  sectionConfigsByName,
  sectionError,
  sectionOperation,
  onAddSection,
  onEditSection,
  onDuplicateSection,
  onDeleteSection,
  onReorderSections,
}: {
  breadcrumbSlug: string
  breadcrumbName: string | null
  isGlobal: boolean
  sections: Section[]
  sectionConfigs: SectionConfig[]
  sectionConfigsByName: Map<string, SectionConfig>
  sectionError: string | null
  sectionOperation: SectionOperation | null
  onAddSection: (sectionConfig: SectionConfig) => void | Promise<void>
  onEditSection: (section: Section) => void
  onDuplicateSection: (section: Section) => void | Promise<void>
  onDeleteSection: (section: Section) => void
  onReorderSections: (sections: Section[]) => void | Promise<void>
}) {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-4 flex items-center gap-2 text-sm"
      >
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
        <ChevronRight className="size-3.5 opacity-60" />
        <Link href="/admin" className="hover:text-foreground font-mono">
          {breadcrumbSlug}
        </Link>
        {breadcrumbName ? (
          <>
            <ChevronRight className="size-3.5 opacity-60" />
            <span className="text-foreground">{breadcrumbName}</span>
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
              {sectionError ? (
                <p role="alert" className="text-destructive text-sm">
                  {sectionError}
                </p>
              ) : null}
              <EmptyContent>
                <AddSectionButton
                  sectionConfigs={sectionConfigs}
                  disabled={sectionOperation !== null}
                  onAdd={onAddSection}
                />
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <SectionList
                sections={sections}
                sectionConfigsByName={sectionConfigsByName}
                disabled={sectionOperation !== null}
                onReorder={onReorderSections}
                onEdit={onEditSection}
                onDuplicate={onDuplicateSection}
                onDelete={onDeleteSection}
              />
              {sectionError ? (
                <p role="alert" className="text-destructive mt-4 text-sm">
                  {sectionError}
                </p>
              ) : null}
              <div className="mt-6 flex justify-start">
                <AddSectionButton
                  sectionConfigs={sectionConfigs}
                  disabled={sectionOperation !== null}
                  onAdd={onAddSection}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function SectionList({
  sections,
  sectionConfigsByName,
  disabled,
  onReorder,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  sections: Section[]
  sectionConfigsByName: Map<string, SectionConfig>
  disabled: boolean
  onReorder: (sections: Section[]) => void | Promise<void>
  onEdit: (section: Section) => void
  onDuplicate: (section: Section) => void | Promise<void>
  onDelete: (section: Section) => void
}) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [dragOrder, setDragOrder] = React.useState<Section[] | null>(null)
  const [reordering, setReordering] = React.useState(false)
  const rowRefs = React.useRef<Array<HTMLLIElement | null>>([])
  const openRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const visibleSections = dragOrder ?? sections
  const activeSectionIndex =
    visibleSections.length === 0
      ? 0
      : Math.min(activeIndex, visibleSections.length - 1)

  React.useEffect(() => {
    rowRefs.current.length = visibleSections.length
    openRefs.current.length = visibleSections.length
  }, [visibleSections.length])

  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      rowRefs.current[0]?.focus()
    })
  }, [])

  const focusRow = (index: number) => {
    if (index < 0 || index >= visibleSections.length) return

    setActiveIndex(index)
    rowRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const focusedIndex = rowRefs.current.findIndex(
      (row) => row === document.activeElement,
    )
    const currentIndex = focusedIndex >= 0 ? focusedIndex : activeSectionIndex

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusRow(Math.min(currentIndex + 1, visibleSections.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusRow(Math.max(currentIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusRow(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusRow(visibleSections.length - 1)
    } else if (event.key === 'Enter') {
      if (
        document.activeElement === event.currentTarget ||
        document.activeElement === rowRefs.current[currentIndex]
      ) {
        event.preventDefault()
        openRefs.current[currentIndex]?.click()
      }
    }
  }

  const startReorder = () => {
    if (!dragOrder) setDragOrder(visibleSections)
  }

  const commitReorder = async () => {
    if (!dragOrder) return
    const changed = dragOrder.some(
      (section, index) => section._id !== sections[index]?._id,
    )
    if (!changed) {
      setDragOrder(null)
      return
    }

    const activeSection = visibleSections[activeSectionIndex]
    setReordering(true)
    try {
      await onReorder(dragOrder)
      if (activeSection) {
        const nextIndex = dragOrder.findIndex(
          (section) => section._id === activeSection._id,
        )
        if (nextIndex >= 0) setActiveIndex(nextIndex)
      }
    } finally {
      setReordering(false)
      setDragOrder(null)
    }
  }

  return (
    <Reorder.Group
      axis="y"
      values={visibleSections}
      onReorder={setDragOrder}
      role="listbox"
      aria-label="Sections"
      aria-activedescendant={`admin-section-${visibleSections[activeSectionIndex]?._id ?? ''}`}
      onKeyDown={handleKeyDown}
      aria-busy={reordering || disabled}
      className="flex w-full list-none flex-col gap-2.5 p-0"
    >
      {visibleSections.map((section, index) => (
        <SectionRow
          key={section._id}
          section={section}
          config={sectionConfigsByName.get(section.name)}
          isActive={activeSectionIndex === index}
          rowRef={(element) => {
            rowRefs.current[index] = element
          }}
          openRef={(element) => {
            openRefs.current[index] = element
          }}
          disabled={disabled}
          reordering={reordering}
          onFocus={() => setActiveIndex(index)}
          onReorderStart={startReorder}
          onReorderEnd={() => void commitReorder()}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </Reorder.Group>
  )
}

function SectionRow({
  section,
  config,
  isActive,
  rowRef,
  openRef,
  disabled,
  reordering,
  onFocus,
  onReorderStart,
  onReorderEnd,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  section: Section
  config?: SectionConfig
  isActive: boolean
  rowRef: (element: HTMLLIElement | null) => void
  openRef: (element: HTMLButtonElement | null) => void
  disabled: boolean
  reordering: boolean
  onFocus: () => void
  onReorderStart: () => void
  onReorderEnd: () => void
  onEdit: (section: Section) => void
  onDuplicate: (section: Section) => void | Promise<void>
  onDelete: (section: Section) => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      ref={rowRef}
      value={section}
      dragListener={false}
      dragControls={controls}
      id={`admin-section-${section._id}`}
      role="option"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onFocus={onFocus}
      onDragStart={onReorderStart}
      onDragEnd={onReorderEnd}
      className={cn(
        'group/item bg-muted/50 hover:bg-muted relative flex w-full flex-wrap items-center gap-3.5 rounded-2xl border border-transparent px-3.5 py-3 text-sm transition-colors outline-none',
        'focus-visible:ring-ring focus-visible:ring-2',
        isActive && 'ring-ring/30 ring-2',
        (reordering || disabled) && 'pointer-events-none opacity-70',
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        tabIndex={-1}
        disabled={reordering || disabled}
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
          <ItemTitle>{getSectionTitle(section, config)}</ItemTitle>
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

function AddSectionButton({
  sectionConfigs,
  disabled,
  onAdd,
}: {
  sectionConfigs: SectionConfig[]
  disabled: boolean
  onAdd: (sectionConfig: SectionConfig) => void | Promise<void>
}) {
  const [addingSection, setAddingSection] = React.useState<string | null>(null)

  const addSection = async (sectionConfig: SectionConfig) => {
    setAddingSection(sectionConfig.name)
    try {
      await onAdd(sectionConfig)
    } finally {
      setAddingSection(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button disabled={disabled || addingSection !== null}>
            <Plus />
            Add section
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-72">
        {sectionConfigs.map((sectionConfig) => (
          <DropdownMenuItem
            key={sectionConfig.name}
            disabled={disabled || addingSection !== null}
            onClick={() => void addSection(sectionConfig)}
          >
            <Blocks />
            <span className="grid gap-0.5">
              <span>{sectionConfig.label ?? sectionConfig.name}</span>
              {sectionConfig.description ? (
                <span className="text-muted-foreground line-clamp-2 text-xs font-normal">
                  {sectionConfig.description}
                </span>
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SectionShellDialog({
  section,
  config,
  slug,
  name,
  isGlobal,
  onOpenChange,
}: {
  section: Section | null
  config?: SectionConfig
  slug: string
  name: string | null
  isGlobal: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogStack open={section !== null} onOpenChange={onOpenChange}>
      {section ? (
        <SectionEditorStack
          key={section._id}
          section={section}
          config={config}
          slug={slug}
          name={name}
          isGlobal={isGlobal}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </DialogStack>
  )
}

function SectionEditorStack({
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
}) {
  const updateSection = useMutation(api.services.updateSection)
  const [formData, setFormData] = React.useState<Record<string, unknown>>(() =>
    normalizeFormData(
      isRecord(section.data) ? section.data : {},
      config?.fields ?? {},
    ),
  )
  const [initialSerializedFormData, setInitialSerializedFormData] =
    React.useState(() => serializeFormData(formData))
  const [activeArrayPath, setActiveArrayPath] = React.useState<ArrayItemPath[]>(
    [],
  )
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false)
  const previousLayerRef = React.useRef<HTMLButtonElement | null>(null)
  const fieldEntries = Object.entries(config?.fields ?? {})
  const serializedFormData = React.useMemo(
    () => serializeFormData(formData),
    [formData],
  )
  const isDirty = serializedFormData !== initialSerializedFormData

  const closeOneLayer = React.useCallback(() => {
    if (activeArrayPath.length > 0) {
      previousLayerRef.current?.click()
      return
    }

    if (isDirty) {
      setConfirmDiscardOpen(true)
      return
    }

    onClose()
  }, [activeArrayPath.length, isDirty, onClose])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        confirmDiscardOpen
      ) {
        return
      }

      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          '[data-slot="dialog-content"], [data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-slot="select-content"]',
        )
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      closeOneLayer()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOneLayer, confirmDiscardOpen])

  React.useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const updateField = (
    path: ArrayItemPath[],
    fieldName: string,
    value: unknown,
  ) => {
    setFormData((current) => {
      if (path.length === 0) return { ...current, [fieldName]: value }

      return updateItemAtPath(current, path, (item) => ({
        ...item,
        [fieldName]: value,
      }))
    })
  }

  const addArrayItem = (
    path: ArrayItemPath[],
    fieldName: string,
    itemFields: Record<string, HeadcodeFieldConfig>,
  ) => {
    setFormData((current) =>
      updateArrayAtPath(current, path, fieldName, (items) => [
        ...items,
        createArrayItem(itemFields),
      ]),
    )
  }

  const deleteArrayItem = (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
  ) => {
    setFormData((current) =>
      updateArrayAtPath(current, path, fieldName, (items) =>
        items.filter((_, itemIndex) => itemIndex !== index),
      ),
    )
    setActiveArrayPath((currentPath) =>
      currentPath.length > path.length &&
      currentPath[path.length]?.fieldName === fieldName &&
      currentPath[path.length]?.index === index
        ? path
        : currentPath,
    )
  }

  const moveArrayItemInField = (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
    direction: -1 | 1,
  ) => {
    setFormData((current) =>
      updateArrayAtPath(current, path, fieldName, (items) =>
        moveArrayItem(items, index, direction),
      ),
    )
  }

  const handleSave = async () => {
    const data = serializedFormData

    setSaving(true)
    setError(null)

    try {
      await updateSection({
        id: section._id,
        name: section.name,
        pos: section.pos,
        data,
        entry: section.entry,
      })
      setInitialSerializedFormData(data)
      onClose()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Could not save section.',
      )
    } finally {
      setSaving(false)
    }
  }

  const renderBreadcrumb = (
    sectionName: string,
    path: ArrayItemPath[] = [],
  ) => (
    <DialogStackDescription className="mt-3 flex flex-wrap items-center gap-2 text-sm">
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
      <ChevronRight className="size-3.5 opacity-60" />
      <span className="font-mono">{slug}</span>
      {name ? (
        <>
          <ChevronRight className="size-3.5 opacity-60" />
          <span>{name}</span>
        </>
      ) : null}
      <ChevronRight className="size-3.5 opacity-60" />
      <span className="font-mono">{sectionName}</span>
      {path.map((step) => (
        <React.Fragment key={`${step.fieldName}-${step.index}`}>
          <ChevronRight className="size-3.5 opacity-60" />
          <span>{step.fieldLabel}</span>
          <ChevronRight className="size-3.5 opacity-60" />
          <span className="text-foreground font-mono">{step.index + 1}</span>
        </React.Fragment>
      ))}
    </DialogStackDescription>
  )

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
                  onClick={() =>
                    setActiveArrayPath((current) => current.slice(0, -1))
                  }
                >
                  Close layer
                </button>
              </DialogStackPrevious>
              <DialogStackHeader className="shrink-0 pb-6">
                <DialogStackTitle className="flex items-center gap-3 text-2xl">
                  <span>{getSectionTitle(section, config)}</span>
                  {isDirty ? (
                    <span className="bg-muted text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium uppercase">
                      Unsaved
                    </span>
                  ) : null}
                </DialogStackTitle>
                {renderBreadcrumb(section.name)}
              </DialogStackHeader>
              <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 outline-none">
                {config?.description ? (
                  <p className="text-muted-foreground text-sm">
                    {config.description}
                  </p>
                ) : null}
                {fieldEntries.length > 0 ? (
                  <FieldGroup>
                    {fieldEntries.map(([fieldName, field]) => (
                      <FieldEditor
                        key={fieldName}
                        name={fieldName}
                        field={field}
                        value={formData[fieldName]}
                        path={[]}
                        onChange={(value) => updateField([], fieldName, value)}
                        onAddArrayItem={addArrayItem}
                        onDeleteArrayItem={deleteArrayItem}
                        onMoveArrayItem={moveArrayItemInField}
                        onDrill={(step) => setActiveArrayPath([step])}
                      />
                    ))}
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
          ...Array.from({ length: MAX_ARRAY_DEPTH }).map((_, index) => {
            const path = activeArrayPath.slice(0, index + 1)
            const activeStep = path[index]
            const item = activeStep ? getPathItem(formData, path) : null
            const title =
              item && activeStep
                ? getArrayItemTitle(
                    item,
                    activeStep.itemFields,
                    activeStep.index,
                  )
                : 'Item'

            return (
              <DialogStackContent key={index + 1} className="h-[80vh]">
                {item && activeStep ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <DialogStackHeader className="shrink-0 pb-6">
                      <DialogStackTitle className="text-2xl">
                        {title}
                      </DialogStackTitle>
                      {renderBreadcrumb(section.name, path)}
                    </DialogStackHeader>
                    <div className="-mx-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 outline-none">
                      <FieldGroup>
                        {Object.entries(activeStep.itemFields).map(
                          ([fieldName, field]) => (
                            <FieldEditor
                              key={`${path
                                .map(
                                  (step) => `${step.fieldName}:${step.index}`,
                                )
                                .join('/')}/${fieldName}`}
                              name={fieldName}
                              field={field}
                              value={item[fieldName]}
                              path={path}
                              onChange={(value) =>
                                updateField(path, fieldName, value)
                              }
                              onAddArrayItem={addArrayItem}
                              onDeleteArrayItem={deleteArrayItem}
                              onMoveArrayItem={moveArrayItemInField}
                              onDrill={(step) =>
                                setActiveArrayPath([...path, step])
                              }
                            />
                          ),
                        )}
                      </FieldGroup>
                    </div>
                    <DialogStackFooter>
                      <DialogStackPrevious asChild>
                        <Button
                          variant="outline"
                          onClick={() =>
                            setActiveArrayPath((current) =>
                              current.slice(0, -1),
                            )
                          }
                        >
                          Close
                        </Button>
                      </DialogStackPrevious>
                    </DialogStackFooter>
                  </div>
                ) : null}
              </DialogStackContent>
            )
          }),
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

function FieldEditor({
  name,
  field,
  value,
  path,
  onChange,
  onAddArrayItem,
  onDeleteArrayItem,
  onMoveArrayItem,
  onDrill,
}: {
  name: string
  field: HeadcodeFieldConfig
  value: unknown
  path: ArrayItemPath[]
  onChange: (value: unknown) => void
  onAddArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    itemFields: Record<string, HeadcodeFieldConfig>,
  ) => void
  onDeleteArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
  ) => void
  onMoveArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
    direction: -1 | 1,
  ) => void
  onDrill: (step: ArrayItemPath) => void
}) {
  const label = getFieldLabel(name, field)
  const type = getFieldType(field)
  const description = getFieldDescription(field)

  if (Array.isArray(field)) {
    return (
      <ArrayFieldEditor
        name={name}
        label={label}
        field={field}
        value={value}
        path={path}
        onAddArrayItem={onAddArrayItem}
        onDeleteArrayItem={onDeleteArrayItem}
        onMoveArrayItem={onMoveArrayItem}
        onDrill={onDrill}
      />
    )
  }

  if (type === 'text') {
    return (
      <Field>
        <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
        <Input
          id={`field-${name}`}
          value={getStringValue(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  if (type === 'textarea') {
    return (
      <Field>
        <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
        <Textarea
          id={`field-${name}`}
          value={getStringValue(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  if (type === 'richtext') {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <RichtextField value={getStringValue(value)} onChange={onChange} />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  if (type === 'select') {
    const options = Array.isArray(field.options) ? field.options : []

    return (
      <Field>
        <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
        <Select
          value={getStringValue(value)}
          onValueChange={(nextValue) => {
            if (typeof nextValue === 'string') onChange(nextValue)
          }}
        >
          <SelectTrigger id={`field-${name}`}>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  if (type === 'checkbox') {
    return (
      <Field orientation="horizontal">
        <Switch
          id={`field-${name}`}
          checked={getBooleanValue(value)}
          onCheckedChange={onChange}
        />
        <FieldContent>
          <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
          {description ? (
            <FieldDescription>{description}</FieldDescription>
          ) : null}
        </FieldContent>
      </Field>
    )
  }

  if (type === 'link') {
    const link = getLinkValue(value)
    const updateLinkField = (
      key: keyof LinkFieldValue,
      nextValue: string | boolean,
    ) => {
      onChange({ ...link, [key]: nextValue })
    }

    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="bg-muted/30 rounded-2xl border p-3">
          <FieldGroup className="gap-4 @md/field-group:grid @md/field-group:grid-cols-2">
            <Field className="@md/field-group:col-span-1">
              <FieldLabel htmlFor={`field-${name}-title`}>Title</FieldLabel>
              <Input
                id={`field-${name}-title`}
                value={link.title}
                onChange={(event) =>
                  updateLinkField('title', event.target.value)
                }
              />
            </Field>
            <Field className="@md/field-group:col-span-1">
              <FieldLabel htmlFor={`field-${name}-url`}>URL</FieldLabel>
              <Input
                id={`field-${name}-url`}
                value={link.url}
                onChange={(event) => updateLinkField('url', event.target.value)}
              />
            </Field>
            <Field
              orientation="horizontal"
              className="@md/field-group:col-span-2"
            >
              <Switch
                id={`field-${name}-target`}
                checked={link.openInNewWindow}
                onCheckedChange={(checked) =>
                  updateLinkField('openInNewWindow', checked)
                }
              />
              <FieldContent>
                <FieldLabel htmlFor={`field-${name}-target`}>
                  Open in new window
                </FieldLabel>
              </FieldContent>
            </Field>
          </FieldGroup>
        </div>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  if (type === 'image') {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <ImageField
          value={getImageValue(value)}
          accept={field.accept}
          maxSize={field.maxSize}
          onChange={onChange}
        />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </Field>
    )
  }

  return (
    <UnsupportedField
      label={label}
      name={name}
      description={type ? `${type} field` : 'Unsupported field'}
    />
  )
}

function ArrayFieldEditor({
  name,
  label,
  field,
  value,
  path,
  onAddArrayItem,
  onDeleteArrayItem,
  onMoveArrayItem,
  onDrill,
}: {
  name: string
  label: string
  field: HeadcodeFieldConfig
  value: unknown
  path: ArrayItemPath[]
  onAddArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    itemFields: Record<string, HeadcodeFieldConfig>,
  ) => void
  onDeleteArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
  ) => void
  onMoveArrayItem: (
    path: ArrayItemPath[],
    fieldName: string,
    index: number,
    direction: -1 | 1,
  ) => void
  onDrill: (step: ArrayItemPath) => void
}) {
  const itemFields = getArrayFieldConfig(field)
  const items = getArrayItems(value)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const rowRefs = React.useRef<Array<HTMLLIElement | null>>([])
  const openRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const activeItemIndex =
    items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1)

  React.useEffect(() => {
    rowRefs.current.length = items.length
    openRefs.current.length = items.length
  }, [items.length])

  if (!itemFields) {
    return (
      <UnsupportedField
        label={label}
        name={name}
        description="Array has no item fields"
      />
    )
  }

  const focusItem = (index: number) => {
    if (index < 0 || index >= items.length) return

    setActiveIndex(index)
    rowRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const focusedIndex = rowRefs.current.findIndex(
      (row) => row === document.activeElement,
    )
    const currentIndex = focusedIndex >= 0 ? focusedIndex : activeItemIndex

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusItem(Math.min(currentIndex + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusItem(Math.max(currentIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusItem(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusItem(items.length - 1)
    } else if (event.key === 'Enter') {
      if (document.activeElement === rowRefs.current[currentIndex]) {
        event.preventDefault()
        openRefs.current[currentIndex]?.click()
      }
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {items.length > 0 ? (
          <ul
            role="listbox"
            aria-label={label}
            aria-activedescendant={`array-item-${path.map((step) => `${step.fieldName}-${step.index}`).join('-')}-${name}-${activeItemIndex}`}
            onKeyDown={handleKeyDown}
            className="flex w-full list-none flex-col gap-2 p-0"
          >
            {items.map((item, index) => (
              <ArrayItemRow
                key={index}
                item={item}
                fields={itemFields}
                index={index}
                id={`array-item-${path.map((step) => `${step.fieldName}-${step.index}`).join('-')}-${name}-${index}`}
                isActive={activeItemIndex === index}
                canMoveUp={index > 0}
                canMoveDown={index < items.length - 1}
                rowRef={(element) => {
                  rowRefs.current[index] = element
                }}
                openRef={(element) => {
                  openRefs.current[index] = element
                }}
                onFocus={() => setActiveIndex(index)}
                onEdit={() =>
                  onDrill({
                    fieldName: name,
                    fieldLabel: label,
                    index,
                    itemFields,
                  })
                }
                onMoveUp={() => onMoveArrayItem(path, name, index, -1)}
                onMoveDown={() => onMoveArrayItem(path, name, index, 1)}
                onDelete={() => onDeleteArrayItem(path, name, index)}
              />
            ))}
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
            onClick={() => onAddArrayItem(path, name, itemFields)}
          >
            <Plus />
            Add item
          </Button>
        </div>
      </div>
    </Field>
  )
}

function ArrayItemRow({
  item,
  fields,
  index,
  id,
  isActive,
  canMoveUp,
  canMoveDown,
  rowRef,
  openRef,
  onFocus,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  item: ArrayItem
  fields: Record<string, HeadcodeFieldConfig>
  index: number
  id: string
  isActive: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  rowRef: (element: HTMLLIElement | null) => void
  openRef: (element: HTMLButtonElement | null) => void
  onFocus: () => void
  onEdit: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const title = getArrayItemTitle(item, fields, index)
  const description = getArrayItemDescription(item, fields)

  return (
    <li
      ref={rowRef}
      id={id}
      role="option"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onFocus={onFocus}
      className={cn(
        'group/item bg-muted/50 hover:bg-muted relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm transition-colors outline-none',
        'focus-visible:ring-ring focus-visible:ring-2',
        isActive && 'ring-ring/30 ring-2',
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
          ref={openRef}
          type="button"
          tabIndex={-1}
          onClick={onEdit}
          className="focus-visible:ring-ring flex flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <ItemContent>
            <ItemTitle>{title}</ItemTitle>
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
              <Button variant="outline" size="icon-sm" aria-label="Actions">
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DialogStackNext asChild>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            </DialogStackNext>
            <DropdownMenuItem disabled={!canMoveUp} onClick={onMoveUp}>
              <ArrowUp />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canMoveDown} onClick={onMoveDown}>
              <ArrowDown />
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </li>
  )
}

function UnsupportedField({
  label,
  name,
  description,
}: {
  label: string
  name: string
  description: string
}) {
  return (
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
}
