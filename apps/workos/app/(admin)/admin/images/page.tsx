'use client'

import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
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
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'

import {
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../../_components/admin-ui'
import { AdminShell } from '../../_components/chrome'
import { formatBytes } from '../../_fields/image-field'
import { useActions } from '../../_lib/use-actions'

const PAGE_SIZE = 24

const dimensions = (image: Doc<'images'>) =>
  `${Number(image.width)}x${Number(image.height)}px`

export default function AdminImagesPage() {
  return (
    <AdminShell loadingLabel="Loading images...">
      <ImageGallery />
    </AdminShell>
  )
}

const ImageGallery = () => {
  const [query, setQuery] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<Id<'images'> | null>(null)
  const {
    results: images,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.services.getImages,
    { filter: query.trim() || undefined },
    { initialNumItems: PAGE_SIZE },
  )
  const selected = images.find((image) => image._id === selectedId) ?? null

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
            {status === 'LoadingFirstPage' ? (
              <LoadingState>Loading images...</LoadingState>
            ) : images.length === 0 ? (
              <EmptyState icon={<ImageIcon />} title="No images found">
                Upload images from an image field, then manage them here.
              </EmptyState>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {images.map((image) => (
                    <li key={image._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(image._id)}
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
                          <p className="truncate text-sm font-medium">
                            {image.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                            {dimensions(image)} · {image.type}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                {status === 'CanLoadMore' && (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadMore(PAGE_SIZE)}
                    >
                      Load more
                    </Button>
                    <span className="text-muted-foreground text-xs">
                      Showing {images.length}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          {selected && (
            <ImageDetailsForm
              key={selected._id}
              image={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

const ImageDetailsForm = ({
  image,
  onClose,
}: {
  image: Doc<'images'>
  onClose: () => void
}) => {
  const [name, setName] = React.useState(image.name)
  const [alt, setAlt] = React.useState(image.alt)
  const [copied, setCopied] = React.useState(false)
  const { pending, error, run } = useActions<'save' | 'delete'>()
  const updateImageMetadata = useMutation(api.services.updateImageMetadata)
  const deleteImage = useMutation(api.services.deleteImage)
  const usageCount = useQuery(api.services.getImageUsage, {
    id: image._id,
  })?.count
  const busy = pending.length > 0

  const saveImage = () =>
    run(
      'save',
      async () => {
        await updateImageMetadata({
          id: image._id,
          name: name.trim() || image.name,
          alt,
        })
        onClose()
      },
      'Could not save image details.',
    )

  const removeImage = () =>
    run(
      'delete',
      async () => {
        await deleteImage({ id: image._id })
        onClose()
      },
      'Could not delete image.',
    )

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
            <span>{dimensions(image)}</span>
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
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`image-alt-${image._id}`}>Alt text</Label>
            <Input
              id={`image-alt-${image._id}`}
              value={alt}
              disabled={busy}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Describe the image for screen readers"
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">
              {usageCount === undefined
                ? 'Checking content usage...'
                : usageCount > 0
                  ? `Used by ${usageCount} section${usageCount === 1 ? '' : 's'}`
                  : 'Not used by any section'}
            </div>
            {usageCount !== undefined && usageCount > 0 && (
              <p className="text-muted-foreground text-xs">
                Images referenced by content cannot be deleted. Remove the image
                from those sections first.
              </p>
            )}
          </div>
        </div>
      </div>

      <ErrorAlert error={error} />

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={busy || usageCount !== 0}
          onClick={removeImage}
        >
          {pending.includes('delete') ? (
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
            disabled={busy}
            onClick={onClose}
          >
            Close
          </Button>
          <Button type="button" disabled={busy} onClick={saveImage}>
            {pending.includes('save') && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
