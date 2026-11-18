'use client'

import { Loader2, Upload } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { upload, type Media } from '../_lib/api'

// The types and size POST /admin/media accepts (headcode/media.ts).
const accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif'
const maxSize = 4 * 1024 * 1024

export const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size % 1 === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unit]}`
}

export const dimensions = (media: Pick<Media, 'width' | 'height'>) =>
  media.width && media.height ? `${media.width}x${media.height}px` : ''

// Admin thumbnails load the file as is; the site serves it with next/image.
export const Thumb = ({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className={cn('absolute inset-0 size-full object-cover', className)}
  />
)

// Drop or pick images; each is uploaded on its own.
export const UploadArea = ({
  multiple,
  onUploaded,
  className,
}: {
  multiple?: boolean
  onUploaded?: (media: Media) => void
  className?: string
}) => {
  const [uploading, setUploading] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of multiple ? files : files.slice(0, 1)) {
        if (file.size > maxSize)
          throw new Error(`${file.name} is larger than 4 MB.`)
        onUploaded?.(await upload(file))
      }
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
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!uploading) void uploadFiles([...event.dataTransfer.files])
        }}
        className={cn(
          'bg-muted/30 hover:bg-muted/50 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 transition-colors',
          dragging && 'border-ring bg-muted/50',
          uploading && 'pointer-events-none opacity-70',
          className,
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            void uploadFiles([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
        <div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-md">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-sm font-medium">
            {uploading
              ? 'Uploading image'
              : multiple
                ? 'Upload images'
                : 'Upload an image'}
          </p>
          <p className="text-muted-foreground text-xs">
            Drag and drop or click to upload JPEG, PNG, WebP, AVIF or GIF, up to
            4 MB
          </p>
        </div>
      </label>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
