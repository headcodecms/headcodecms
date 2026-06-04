'use client'

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react'
import { Check, Copy, ImageIcon, Loader2, Search, Trash2 } from 'lucide-react'
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
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'

import { AdminHeader } from '../../_components/chrome'
import { Container } from '../../_components/container'
import { useAdminHeadcodeVersion } from '../../_lib/headcode'

const PAGE_SIZE = 24

export default function AdminImagesPage() {
  const { version, resolved: versionResolved } = useAdminHeadcodeVersion()

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
            <ImageGallery />
          </Authenticated>
        </Container>
      </main>
    </div>
  )
}

function ImageGallery() {
  const [query, setQuery] = React.useState('')
  const [selectedImageId, setSelectedImageId] = React.useState<string | null>(
    null,
  )
  const filter = query.trim() || undefined
  const {
    results: images,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.services.getImages,
    { filter },
    { initialNumItems: PAGE_SIZE },
  )

  const selectedImage = selectedImageId
    ? (images.find((image) => image._id === selectedImageId) ?? null)
    : null
  const loadingFirstPage = status === 'LoadingFirstPage'
  const loadingMore = status === 'LoadingMore'
  const hasMore = status === 'CanLoadMore'

  return (
    <>
      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Images
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage uploaded images, metadata, and unused assets.
            </p>
          </div>

          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images..."
              autoFocus
            />
          </InputGroup>

          <div className="mt-6">
            {loadingFirstPage ? (
              <LoadingState />
            ) : images.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ImageIcon />
                  </EmptyMedia>
                  <EmptyTitle>No images found</EmptyTitle>
                  <EmptyDescription>
                    Upload images from an image field, then manage them here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((image) => (
                    <li key={image._id}>
                      <ImageCard
                        image={image}
                        onOpen={() => setSelectedImageId(image._id)}
                      />
                    </li>
                  ))}
                </ul>
                {hasMore ? (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loadingMore}
                      onClick={() => loadMore(PAGE_SIZE)}
                    >
                      {loadingMore ? (
                        <Loader2 className="animate-spin" />
                      ) : null}
                      {loadingMore ? 'Loading...' : 'Load more'}
                    </Button>
                    <span className="text-muted-foreground text-xs">
                      Showing {images.length}
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ImageDetailsDialog
        image={selectedImage}
        onOpenChange={(open) => {
          if (!open) setSelectedImageId(null)
        }}
      />
    </>
  )
}

function ImageCard({
  image,
  onOpen,
}: {
  image: Doc<'images'>
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group bg-muted focus-visible:ring-ring relative block aspect-square w-full overflow-hidden rounded-xl border text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
      />
      <div className="from-background/95 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-3 pt-10">
        <p className="truncate text-sm font-medium">{image.name}</p>
        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
          {Number(image.width)}x{Number(image.height)}px · {image.type}
        </p>
      </div>
    </button>
  )
}

function ImageDetailsDialog({
  image,
  onOpenChange,
}: {
  image: Doc<'images'> | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={image !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {image ? (
          <ImageDetailsForm
            key={image._id}
            image={image}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ImageDetailsForm({
  image,
  onClose,
}: {
  image: Doc<'images'>
  onClose: () => void
}) {
  const [name, setName] = React.useState(image.name)
  const [alt, setAlt] = React.useState(image.alt)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [operation, setOperation] = React.useState<'save' | 'delete' | null>(
    null,
  )
  const updateImageMetadata = useMutation(api.services.updateImageMetadata)
  const deleteImage = useMutation(api.services.deleteImage)
  const usage = useQuery(api.services.getImageUsage, { id: image._id })
  const usageCount = usage?.count ?? 0
  const canDelete = usage !== undefined && usageCount === 0

  const saveImage = async () => {
    setOperation('save')
    setError(null)

    try {
      await updateImageMetadata({
        id: image._id,
        name: name.trim() || image.name,
        alt,
      })
      onClose()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save image details.',
      )
    } finally {
      setOperation(null)
    }
  }

  const removeImage = async () => {
    setOperation('delete')
    setError(null)

    try {
      await deleteImage({ id: image._id })
      onClose()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete image.',
      )
    } finally {
      setOperation(null)
    }
  }

  const copyUrl = async () => {
    await navigator.clipboard.writeText(image.src)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Image details</DialogTitle>
        <DialogDescription>
          Update metadata and remove images that are no longer used by content.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div>
          <div className="bg-muted relative aspect-square overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.src}
              alt={image.alt}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs">
            <span>
              {Number(image.width)}x{Number(image.height)}px
            </span>
            <span>{image.type}</span>
            <span>{formatBytes(Number(image.size))}</span>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`image-url-${image._id}`}>URL</Label>
            <InputGroup>
              <InputGroupInput
                id={`image-url-${image._id}`}
                readOnly
                value={image.src}
                className="font-mono"
              />
              <InputGroupAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy image URL"
                  onClick={copyUrl}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`image-name-${image._id}`}>Name</Label>
            <Input
              id={`image-name-${image._id}`}
              value={name}
              disabled={operation !== null}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`image-alt-${image._id}`}>Alt text</Label>
            <Input
              id={`image-alt-${image._id}`}
              value={alt}
              disabled={operation !== null}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe the image for screen readers"
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              {usage === undefined
                ? 'Checking content usage...'
                : usageCount > 0
                  ? `Used by ${usageCount} section${usageCount === 1 ? '' : 's'}`
                  : 'Not used by any section'}
            </div>
            {usage !== undefined && usageCount > 0 ? (
              <p className="text-muted-foreground text-xs">
                Images referenced by content cannot be deleted. Remove the image
                from those sections first.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={operation !== null || !canDelete}
          onClick={removeImage}
        >
          {operation === 'delete' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Trash2 />
          )}
          Delete
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={operation !== null}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={operation !== null}
            onClick={saveImage}
          >
            {operation === 'save' ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

function LoadingState() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" />
      Loading images...
    </div>
  )
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}
