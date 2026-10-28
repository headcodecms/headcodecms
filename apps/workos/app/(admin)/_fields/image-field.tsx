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
import { errorMessage } from '../_lib/use-actions'

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

const CARD = 'bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3'
const THUMB =
  'bg-muted aspect-square w-full shrink-0 rounded-xl border sm:size-28'

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
  const updateImageMetadata = useMutation(api.services.updateImageMetadata)
  const image = useQuery(
    api.services.getImage,
    value ? { id: value.imageId } : 'skip',
  )
  const openLibrary = () => setLibraryOpen(true)

  const upload = async (file: File) => {
    if (file.size > maxSize)
      throw new Error(`Image must be ${formatBytes(maxSize)} or smaller.`)
    if (!isAcceptedFile(file, accept))
      throw new Error('Image type is not allowed.')

    const { width, height, blurDataURL } = await readImageProps(file)
    const response = await fetch(await generateUploadUrl({}), {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    })
    if (!response.ok) throw new Error('Could not upload image.')

    const { storageId } = (await response.json()) as {
      storageId: Id<'_storage'>
    }
    const { _id } = await addUploadedImage({
      storageId,
      alt: image?.alt ?? '',
      width: BigInt(width),
      height: BigInt(height),
      blurDataURL,
      name: file.name,
      type: file.type || 'image/*',
      size: BigInt(file.size),
    })
    onChange({ imageId: _id })
  }

  const handleDrop = async ([file]: File[]) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await upload(file)
    } catch (uploadError) {
      setError(errorMessage(uploadError, 'Could not upload image.'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {!value ? (
        <div className="flex flex-col gap-3">
          <Dropzone
            accept={accept}
            disabled={uploading}
            maxFiles={1}
            maxSize={maxSize}
            onDrop={handleDrop}
            className="bg-muted/30 h-auto rounded-2xl border-dashed py-8"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
                <Upload className="size-4" />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading image' : 'Upload an image'}
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
            onClick={openLibrary}
            disabled={uploading}
            className="self-start"
          >
            <Images />
            Select from image library
          </Button>
        </div>
      ) : image === undefined ? (
        <div className={cn(CARD, 'sm:flex-row sm:items-center')}>
          <div className={cn(THUMB, 'relative overflow-hidden')} />
          <p className="text-muted-foreground text-sm">Loading image...</p>
        </div>
      ) : image === null ? (
        <div className={cn(CARD, 'sm:flex-row sm:items-center')}>
          <div
            className={cn(
              THUMB,
              'text-muted-foreground flex items-center justify-center',
            )}
          >
            <ImageIcon className="size-5" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium">Image not found</p>
            <p className="text-muted-foreground text-xs">
              Select a different image or remove this field value.
            </p>
            <ImageActions
              onSelect={openLibrary}
              onDelete={() => onChange(null)}
            />
          </div>
        </div>
      ) : (
        <ImagePreview
          image={image}
          onAltChange={(alt) =>
            updateImageMetadata({ id: image._id, name: image.name, alt })
          }
          onSelect={openLibrary}
          onDelete={() => onChange(null)}
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
        onSelect={(selected) => {
          onChange({ imageId: selected._id })
          setLibraryOpen(false)
        }}
      />
    </>
  )
}

const ImageActions = ({
  onSelect,
  onDelete,
}: {
  onSelect: () => void
  onDelete: () => void
}) => (
  <div className="flex items-center gap-1">
    <Button type="button" variant="ghost" size="sm" onClick={onSelect}>
      <Replace />
      Select
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={onDelete}
    >
      <Trash2 />
      Delete
    </Button>
  </div>
)

const ImagePreview = ({
  image,
  onAltChange,
  onSelect,
  onDelete,
}: {
  image: Doc<'images'>
  onAltChange: (alt: string) => void
  onSelect: () => void
  onDelete: () => void
}) => {
  const [copied, setCopied] = React.useState(false)
  const altId = `image-alt-${image._id}`

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(image.src)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Copy is progressive enhancement only.
    }
  }

  return (
    <div className={cn(CARD, 'sm:flex-row sm:items-stretch')}>
      <div className={cn(THUMB, 'relative overflow-hidden')}>
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
            onClick={copyUrl}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={altId} className="text-muted-foreground text-xs">
            Alt text
          </label>
          <Input
            key={image._id}
            id={altId}
            defaultValue={image.alt}
            onBlur={(event) => {
              if (event.target.value !== image.alt)
                onAltChange(event.target.value)
            }}
            placeholder="Describe the image for screen readers"
            className="h-8"
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
          <ImageActions onSelect={onSelect} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

const ImageLibraryDialog = ({
  open,
  onOpenChange,
  currentImageId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentImageId?: Id<'images'>
  onSelect: (image: Doc<'images'>) => void
}) => {
  const [query, setQuery] = React.useState('')
  const {
    results: images,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.services.getImages,
    open ? { filter: query.trim() || undefined } : 'skip',
    { initialNumItems: PAGE_SIZE },
  )
  const loadingMore = status === 'LoadingMore'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('')
        onOpenChange(next)
      }}
    >
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
          {status === 'LoadingFirstPage' ? (
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
                {images.map((image) => {
                  const selected = currentImageId === image._id
                  return (
                    <li key={image._id}>
                      <button
                        type="button"
                        onClick={() => onSelect(image)}
                        className={cn(
                          'group focus-visible:ring-ring bg-muted relative block w-full overflow-hidden rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                          selected &&
                            'ring-ring ring-offset-background ring-2 ring-offset-2',
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
                          <span className="truncate text-xs font-medium">
                            {image.name}
                          </span>
                        </div>
                        {selected ? (
                          <div className="bg-foreground text-background absolute top-2 right-2 flex size-6 items-center justify-center rounded-full">
                            <Check className="size-3.5" />
                          </div>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {status === 'CanLoadMore' ? (
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

// Reads dimensions and a ThumbHash blur placeholder (max 100px) from the file.
const readImageProps = async (file: File) => {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Failed to load image.'))
      image.src = url
    })
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      blurDataURL: calculateBlurDataURL(image),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
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
    const { width, height, data } = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    )
    return thumbHashToDataURL(rgbaToThumbHash(width, height, data))
  } catch {
    return DEFAULT_BLUR_DATA_URL
  }
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`
}

const isAcceptedFile = (file: File, accept: ImageFieldAccept) => {
  if (accept[file.type]) return true
  const extension = file.name.match(/\.[^.]*$/)?.[0].toLowerCase() ?? ''
  return Object.values(accept).some((extensions) =>
    extensions.some((value) => value.toLowerCase() === extension),
  )
}
