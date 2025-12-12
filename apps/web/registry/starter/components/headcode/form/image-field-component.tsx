'use client'

import {
  addImage,
  uploadFile,
} from '@/app/(headcode)/headcode/section/[entryId]/[sectionId]/storage'
import { ImagePreview } from '@/components/headcode/admin/image-preview'
import { MediaLibraryDialog } from '@/components/headcode/admin/dialogs'
import { Dropzone, DropzoneEmptyState } from '@/components/kibo-ui/dropzone'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { calculateImageProps } from '@/lib/headcode/images'
import type { AddImage, ImageValue } from '@/lib/headcode/types'
import { Trash2Icon, Undo2Icon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useFieldContext } from './app-form'
import { Button } from '@/components/ui/button'

export default function ImageFieldComponent({
  label,
  description,
  options,
}: {
  label: string
  description?: string | undefined
  options?: {
    accept?: Record<string, string[]>
    maxFiles?: number
    maxSize?: number
    minSize?: number
  }
}) {
  const field = useFieldContext<ImageValue | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false)
  // Store the initial value to restore on undo
  const initialValueRef = useRef<ImageValue | null>(field.state.value)

  // Update initial value when field is reset (e.g., after form save)
  useEffect(() => {
    if (!field.state.meta.isDirty) {
      initialValueRef.current = field.state.value
    }
  }, [field.state.meta.isDirty, field.state.value])

  const imageValue = field.state.value
  const isDirty = field.state.meta.isDirty
  const hasImage = imageValue !== null

  const accept = options?.accept ?? { 'image/*': [] }
  const maxFiles = options?.maxFiles ?? 1
  const maxSize = options?.maxSize ?? 1024 * 1024 * 10
  const minSize = options?.minSize ?? 1024

  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setError(null)

    try {
      const result = await uploadFile(file)
      if ('error' in result) {
        setError(result.error)
        setUploading(false)
        return
      }

      const img = new window.Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = async () => {
        const imageProps = calculateImageProps(img)

        const fileName = result.name.includes('/')
          ? result.name.split('/').pop() || result.name
          : result.name

        const addImageValue: AddImage = {
          src: result.url,
          alt: fileName.replace(/\.[^/.]+$/, ''), // Remove extension for default alt
          width: imageProps.width,
          height: imageProps.height,
          blurDataURL: imageProps.blurDataURL,
          name: fileName,
          type: result.type,
          size: result.size,
          service: result.service,
          serviceId: result.serviceId,
        }

        const imageValue = await addImage(addImageValue)

        field.handleChange(imageValue)
        setUploading(false)
        URL.revokeObjectURL(objectUrl)
      }

      img.onerror = () => {
        setError('Failed to load image')
        setUploading(false)
        URL.revokeObjectURL(objectUrl)
      }

      img.src = objectUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setUploading(false)
    }
  }

  const handleAltChange = (alt: string) => {
    if (field.state.value) {
      field.handleChange({
        ...field.state.value,
        alt,
      })
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    field.handleChange(null)
    setError(null)
  }

  const handleImageSelect = (image: ImageValue) => {
    field.handleChange(image)
    setError(null)
  }

  const handleUndo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Reset field to its initial value (before it became dirty)
    field.setValue(initialValueRef.current)
    setError(null)
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel className="flex w-full items-center justify-between gap-12">
          <span>{label}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMediaLibraryOpen(true)}
            >
              Media Library
            </Button>
            {hasImage && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2Icon className="size-4" />
              </Button>
            )}
            {!hasImage && isDirty && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUndo}
              >
                <Undo2Icon className="size-4" />
              </Button>
            )}
          </span>
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
        {error && <div className="text-destructive mt-1 text-sm">{error}</div>}
      </FieldContent>
      {!imageValue ? (
        <Dropzone
          accept={accept}
          maxFiles={maxFiles}
          maxSize={maxSize}
          minSize={minSize}
          onDrop={handleDrop}
          disabled={uploading}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="text-muted-foreground text-sm">Uploading...</div>
            </div>
          ) : (
            <DropzoneEmptyState />
          )}
        </Dropzone>
      ) : (
        <ImagePreview
          imageValue={imageValue}
          fieldName={field.name}
          isInvalid={isInvalid}
          onAltChange={handleAltChange}
          onBlur={field.handleBlur}
        />
      )}
      <MediaLibraryDialog
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleImageSelect}
      />
    </Field>
  )
}
