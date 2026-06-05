'use client'

import {
  Check,
  Copy,
  ImageIcon,
  Images,
  Loader2,
  Replace,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import * as React from 'react'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'

import { Dropzone } from '@/components/kibo-ui/dropzone'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import type { ImageFieldAccept, ImageFieldValue } from '@/headcode/types'
import { cn } from '@/lib/utils'

type ImageValue = NonNullable<ImageFieldValue>
type ImageDoc = Pick<
  Doc<'images'>,
  | '_id'
  | 'storageId'
  | 'src'
  | 'alt'
  | 'width'
  | 'height'
  | 'blurDataURL'
  | 'name'
  | 'type'
  | 'size'
>

const PAGE_SIZE = 12
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024
const DEFAULT_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
}
const DEFAULT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lG4IigAAAABJRU5ErkJggg=='

const toImageValue = (image: ImageDoc): ImageValue => ({
  imageId: image._id,
})

const getImageFilter = (file: File) =>
  [file.name, file.type].filter(Boolean).join(' ').toLowerCase()

export const ImageField = ({
  value,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  onChange,
}: {
  value: ImageFieldValue
  accept?: ImageFieldAccept
  maxSize?: number
  onChange: (value: ImageFieldValue) => void
}) => {
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const generateUploadUrl = useMutation(api.services.generateImageUploadUrl)
  const addUploadedImage = useMutation(api.services.addUploadedImage)
  const updateImageAlt = useMutation(api.services.updateImageAlt)
  const selectedImage = useQuery(
    api.services.getImage,
    value ? { id: value.imageId } : 'skip',
  )

  const handleDrop = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      if (file.size > maxSize) {
        throw new Error(`Image must be ${formatBytes(maxSize)} or smaller.`)
      }
      if (!isAcceptedFile(file, accept)) {
        throw new Error('Image type is not allowed.')
      }

      const objectUrl = URL.createObjectURL(file)
      const imageProps = await readImageProps(objectUrl)
      URL.revokeObjectURL(objectUrl)
      const uploadUrl = await generateUploadUrl({})
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Could not upload image.')
      }

      const { storageId } = (await response.json()) as { storageId: string }
      const image = await addUploadedImage({
        storageId: storageId as Id<'_storage'>,
        alt: selectedImage?.alt ?? '',
        width: BigInt(imageProps.width),
        height: BigInt(imageProps.height),
        blurDataURL: imageProps.blurDataURL,
        name: file.name,
        type: file.type || 'image/*',
        size: BigInt(file.size),
        filter: getImageFilter(file),
      })

      onChange(toImageValue(image))
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not upload image.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {value ? (
        <ImagePreviewCard
          image={selectedImage}
          disabled={uploading}
          onAltChange={async (alt) => {
            if (selectedImage)
              await updateImageAlt({ id: selectedImage._id, alt })
          }}
          onDelete={() => onChange(null)}
          onSelect={() => setLibraryOpen(true)}
        />
      ) : (
        <ImageEmptyState
          accept={accept}
          disabled={uploading}
          maxSize={maxSize}
          onDrop={handleDrop}
          onSelect={() => setLibraryOpen(true)}
        />
      )}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <ImageLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        currentImageId={value?.imageId}
        onSelect={(image) => {
          onChange(toImageValue(image))
          setLibraryOpen(false)
        }}
      />
    </>
  )
}

function ImageEmptyState({
  accept,
  disabled,
  maxSize,
  onDrop,
  onSelect,
}: {
  accept: ImageFieldAccept
  disabled: boolean
  maxSize: number
  onDrop: (files: File[]) => void
  onSelect: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Dropzone
        accept={accept}
        disabled={disabled}
        maxFiles={1}
        maxSize={maxSize}
        onDrop={onDrop}
        className="bg-muted/30 h-auto rounded-2xl border-dashed py-8"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
            <Upload className="size-4" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-sm font-medium">
              {disabled ? 'Uploading image' : 'Upload an image'}
            </p>
            <p className="text-muted-foreground text-xs">
              Drag and drop or click to upload, up to {formatBytes(maxSize)}
            </p>
          </div>
        </div>
      </Dropzone>
      <Button
        type="button"
        variant="outline"
        onClick={onSelect}
        disabled={disabled}
        className="self-start"
      >
        <Images />
        Select from image library
      </Button>
    </div>
  )
}

function ImagePreviewCard({
  image,
  disabled,
  onDelete,
  onAltChange,
  onSelect,
}: {
  image: ImageDoc | null | undefined
  disabled: boolean
  onDelete: () => void
  onAltChange: (alt: string) => void | Promise<void>
  onSelect: () => void
}) {
  const [copied, setCopied] = React.useState(false)

  const copyUrl = async () => {
    if (!image) return

    try {
      await navigator.clipboard.writeText(image.src)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Keep copy as progressive enhancement only.
    }
  }

  if (image === undefined) {
    return (
      <div className="bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center">
        <div className="bg-muted relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border sm:size-28" />
        <p className="text-muted-foreground text-sm">Loading image...</p>
      </div>
    )
  }

  if (image === null) {
    return (
      <div className="bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center">
        <div className="bg-muted text-muted-foreground flex aspect-square w-full shrink-0 items-center justify-center rounded-xl border sm:size-28">
          <ImageIcon className="size-5" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium">Image not found</p>
          <p className="text-muted-foreground text-xs">
            Select a different image or remove this field value.
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onSelect}
            >
              <Replace />
              Select
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-stretch">
      <div className="bg-muted relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border sm:size-28">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 sm:py-1">
        <div className="bg-background flex items-center gap-1 rounded-md border pl-2.5">
          <span className="text-muted-foreground/70 shrink-0 font-mono text-xs">
            URL
          </span>
          <span className="flex-1 truncate font-mono text-xs" title={image.src}>
            {image.src}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copied ? 'Copied' : 'Copy URL'}
            disabled={disabled}
            onClick={copyUrl}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`image-alt-${image._id}`}
            className="text-muted-foreground text-xs"
          >
            Alt text
          </label>
          <ImageAltInput
            key={image._id}
            id={`image-alt-${image._id}`}
            initialValue={image.alt}
            disabled={disabled}
            onCommit={(alt) => {
              if (alt !== image.alt) void onAltChange(alt)
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-muted-foreground flex items-center gap-2 font-mono">
            <span>
              {Number(image.width)}x{Number(image.height)}
              <span className="text-muted-foreground/70 ml-0.5">px</span>
            </span>
            {image.type ? (
              <>
                <span className="opacity-50">.</span>
                <span>{image.type}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onSelect}
            >
              <Replace />
              Select
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageAltInput({
  id,
  initialValue,
  disabled,
  onCommit,
}: {
  id: string
  initialValue: string
  disabled: boolean
  onCommit: (value: string) => void
}) {
  const [value, setValue] = React.useState(initialValue)

  return (
    <Input
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onCommit(value)}
      placeholder="Describe the image for screen readers"
      className="h-8"
    />
  )
}

function ImageLibraryDialog({
  open,
  onOpenChange,
  currentImageId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentImageId?: Id<'images'>
  onSelect: (image: Doc<'images'>) => void
}) {
  const [query, setQuery] = React.useState('')
  const filter = query.trim() || undefined
  const {
    results: images,
    status,
    loadMore,
  } = usePaginatedQuery(api.services.getImages, open ? { filter } : 'skip', {
    initialNumItems: PAGE_SIZE,
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('')
    }
    onOpenChange(nextOpen)
  }

  const loadingFirstPage = status === 'LoadingFirstPage'
  const loadingMore = status === 'LoadingMore'
  const hasMore = status === 'CanLoadMore'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-6">
          <DialogTitle>Image library</DialogTitle>
          <DialogDescription>
            Choose an existing image. Use search to filter by name, alt text, or
            type.
          </DialogDescription>
        </DialogHeader>
        <div className="border-b p-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images..."
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loadingFirstPage ? (
            <p className="text-muted-foreground text-sm">Loading images...</p>
          ) : images.length === 0 ? (
            <Empty className="border">
              <EmptyTitle>No images found</EmptyTitle>
              <EmptyDescription>
                Upload an image or try a different search term.
              </EmptyDescription>
            </Empty>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image) => (
                  <li key={image._id}>
                    <LibraryThumb
                      image={image}
                      selected={currentImageId === image._id}
                      onSelect={onSelect}
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
                    {loadingMore ? <Loader2 className="animate-spin" /> : null}
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
      </DialogContent>
    </Dialog>
  )
}

function LibraryThumb({
  image,
  selected,
  onSelect,
}: {
  image: Doc<'images'>
  selected: boolean
  onSelect: (image: Doc<'images'>) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(image)}
      className={cn(
        'group focus-visible:ring-ring bg-muted relative block w-full overflow-hidden rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
        selected && 'ring-ring ring-offset-background ring-2 ring-offset-2',
      )}
      aria-label={`Select ${image.name}`}
    >
      <div className="relative aspect-square w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
      </div>
      <div className="bg-background/90 absolute inset-x-0 bottom-0 flex items-center gap-2 px-2.5 py-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
        <ImageIcon className="text-muted-foreground size-3.5 shrink-0" />
        <span className="truncate text-xs font-medium">{image.name}</span>
      </div>
      {selected ? (
        <div className="bg-foreground text-background absolute top-2 right-2 flex size-6 items-center justify-center rounded-full">
          <Check className="size-3.5" />
        </div>
      ) : null}
    </button>
  )
}

function readImageProps(
  src: string,
): Promise<{ width: number; height: number; blurDataURL: string }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'))
      return
    }

    const image = new window.Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        blurDataURL: calculateBlurDataURL(image),
      })
    }
    image.onerror = () => reject(new Error('Failed to load image.'))
    image.src = src
  })
}

const calculateBlurDataURL = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return DEFAULT_BLUR_DATA_URL

  const scale = 100 / Math.max(image.naturalWidth, image.naturalHeight)
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  try {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const thumbHash = rgbaToThumbHash(pixels.width, pixels.height, pixels.data)
    return thumbHashToDataURL(thumbHash)
  } catch {
    return DEFAULT_BLUR_DATA_URL
  }
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

const isAcceptedFile = (file: File, accept: ImageFieldAccept) => {
  if (accept[file.type]) return true

  const extension = file.name.includes('.')
    ? `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    : ''

  return Object.values(accept).some((extensions) =>
    extensions.map((value) => value.toLowerCase()).includes(extension),
  )
}
