'use client'

import Image from 'next/image'
import { Trash2Icon, ClipboardIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { compactNumber } from '@/lib/headcode/images'
import type { ImageValue } from '@/lib/headcode/types'

export function ImagePreview({
  imageValue,
  fieldName,
  isInvalid,
  onAltChange,
  onDelete,
  onBlur,
}: {
  imageValue: ImageValue
  fieldName: string
  isInvalid: boolean
  onAltChange: (alt: string) => void
  onDelete: () => void
  onBlur: () => void
}) {
  const handleCopyToClipboard = async () => {
    if (imageValue.src) {
      try {
        await navigator.clipboard.writeText(imageValue.src)
      } catch (err) {
        console.error('Failed to copy to clipboard', err)
      }
    }
  }

  return (
    <div className="flex gap-4">
      <div className="relative size-40 shrink-0 overflow-hidden rounded-md border">
        <Image
          src={imageValue.src}
          alt={imageValue.alt}
          width={imageValue.width}
          height={imageValue.height}
          className="h-full w-full object-cover"
          placeholder={imageValue.blurDataURL ? 'blur' : undefined}
          blurDataURL={imageValue.blurDataURL || undefined}
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="text-sm">{imageValue.name}</div>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground max-w-lg truncate overflow-hidden text-xs whitespace-nowrap">
            {imageValue.src}
          </span>
          {imageValue.src && (
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="text-muted-foreground hover:text-foreground"
            >
              <ClipboardIcon className="size-4" />
            </button>
          )}
        </div>
        <Input
          id={`${fieldName}-alt`}
          type="text"
          placeholder="Image ALT text"
          className="w-full"
          value={imageValue.alt ?? ''}
          onChange={(e) => onAltChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={isInvalid}
        />
        <p className="divide-border text-muted-foreground mb-3 flex space-x-3 divide-x divide-solid text-xs">
          <span>
            {imageValue.width}px x {imageValue.height}px
          </span>
          {imageValue.size && <span>{compactNumber(imageValue.size)}</span>}
          <span>{imageValue.type}</span>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onDelete}>
          <Trash2Icon className="size-4" />
          Remove image
        </Button>
      </div>
    </div>
  )
}
