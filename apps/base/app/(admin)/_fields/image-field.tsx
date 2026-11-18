'use client'

import {
  Check,
  Copy,
  ImageIcon,
  Images,
  Replace,
  Search,
  X,
} from 'lucide-react'
import * as React from 'react'

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
import { cn } from '@/lib/utils'
import { dimensions, Thumb, UploadArea } from '../_components/media'
import { useQuery, type Media } from '../_lib/api'

// The value of an ImageField (headcode/fields.ts): a copy of the media
// item's values, with the alt text of this usage.
export type ImageValue = {
  src: string
  alt: string
  width: number
  height: number
  blurDataURL?: string
} | null

const CARD = 'bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3'
const THUMB =
  'bg-muted aspect-square w-full shrink-0 rounded-xl border sm:size-28'

const toValue = (media: Media): ImageValue => ({
  src: media.src,
  alt: media.alt,
  width: media.width ?? 0,
  height: media.height ?? 0,
  ...(media.blurDataURL ? { blurDataURL: media.blurDataURL } : {}),
})

export const ImageField = ({
  value,
  onChange,
}: {
  value: ImageValue
  onChange: (value: ImageValue) => void
}) => {
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const openLibrary = () => setLibraryOpen(true)

  return (
    <>
      {!value ? (
        <div className="flex flex-col gap-3">
          <UploadArea onUploaded={(media) => onChange(toValue(media))} />
          <Button
            type="button"
            variant="outline"
            onClick={openLibrary}
            className="self-start"
          >
            <Images />
            Select from image library
          </Button>
        </div>
      ) : (
        <ImagePreview
          image={value}
          onAltChange={(alt) => onChange({ ...value, alt })}
          onSelect={openLibrary}
          onRemove={() => onChange(null)}
        />
      )}
      <ImageLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        currentSrc={value?.src}
        onSelect={(media) => {
          onChange(toValue(media))
          setLibraryOpen(false)
        }}
      />
    </>
  )
}

const ImagePreview = ({
  image,
  onAltChange,
  onSelect,
  onRemove,
}: {
  image: NonNullable<ImageValue>
  onAltChange: (alt: string) => void
  onSelect: () => void
  onRemove: () => void
}) => {
  const [copied, setCopied] = React.useState(false)
  const altId = React.useId()

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(image.src, window.location.origin).href,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Copy is progressive enhancement only.
    }
  }

  return (
    <div className={cn(CARD, 'sm:flex-row sm:items-stretch')}>
      <div className={cn(THUMB, 'relative overflow-hidden')}>
        <Thumb src={image.src} alt={image.alt} />
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
            id={altId}
            value={image.alt}
            onChange={(event) => onAltChange(event.target.value)}
            placeholder="Describe the image for screen readers"
            className="h-8"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-mono">
            {dimensions(image)}
          </span>
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
              onClick={onRemove}
            >
              <X />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ImageLibraryDialog = ({
  open,
  onOpenChange,
  currentSrc,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSrc?: string
  onSelect: (media: Media) => void
}) => {
  const [query, setQuery] = React.useState('')

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
            Choose an uploaded image, or upload a new one. Use search to filter
            by alt text or file name.
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
          {open ? (
            <MediaGrid
              query={query}
              currentSrc={currentSrc}
              onSelect={onSelect}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mounted only while the dialog is open, so the list loads when needed.
const MediaGrid = ({
  query,
  currentSrc,
  onSelect,
}: {
  query: string
  currentSrc?: string
  onSelect: (media: Media) => void
}) => {
  const list = useQuery<{ media: Media[] }>('media_list')
  const search = query.trim().toLowerCase()
  const media = (list.data?.media ?? []).filter((item) =>
    `${item.alt} ${item.pathname}`.toLowerCase().includes(search),
  )

  return (
    <div className="flex flex-col gap-4">
      <UploadArea className="py-6" onUploaded={onSelect} />
      {list.error ? (
        <p role="alert" className="text-destructive text-sm">
          {list.error}
        </p>
      ) : !list.data ? (
        <p className="text-muted-foreground text-sm">Loading images...</p>
      ) : media.length === 0 ? (
        <Empty className="border">
          <EmptyTitle>No images found</EmptyTitle>
          <EmptyDescription>
            Upload an image or try a different search term.
          </EmptyDescription>
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => {
            const selected = currentSrc === item.src
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={cn(
                    'group focus-visible:ring-ring bg-muted relative block w-full overflow-hidden rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    selected &&
                      'ring-ring ring-offset-background ring-2 ring-offset-2',
                  )}
                  aria-label={`Select ${item.alt || item.pathname}`}
                >
                  <div className="relative aspect-square w-full">
                    <Thumb
                      src={item.src}
                      alt={item.alt}
                      className="transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="bg-background/90 absolute inset-x-0 bottom-0 flex items-center gap-2 px-2.5 py-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <ImageIcon className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="truncate text-xs font-medium">
                      {item.alt || dimensions(item)}
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
      )}
    </div>
  )
}
