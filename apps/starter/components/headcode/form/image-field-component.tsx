'use client'

import { uploadFile } from '@/app/(headcode)/headcode/section/[entryId]/[sectionId]/storage'
import { ImagePreview } from '@/components/headcode/admin/image-preview'
import { Dropzone, DropzoneEmptyState } from '@/components/kibo-ui/dropzone'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { calculateImageProps } from '@/lib/headcode/images'
import type { ImageValue } from '@/lib/headcode/types'
import { Trash2Icon, Undo2Icon } from 'lucide-react'
import { useState } from 'react'
import { useFieldContext } from './app-form'

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

      img.onload = () => {
        const imageProps = calculateImageProps(img)

        const fileName = result.name.includes('/')
          ? result.name.split('/').pop() || result.name
          : result.name

        const imageValue: ImageValue = {
          src: result.url,
          alt: fileName.replace(/\.[^/.]+$/, ''), // Remove extension for default alt
          width: imageProps.width,
          height: imageProps.height,
          blurDataURL: imageProps.blurDataURL,
          name: fileName,
          type: result.type,
          size: result.size,
        }

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

  const handleDelete = () => {
    field.handleChange(null)
    setError(null)
  }

  const imageValue = field.state.value

  // trash icon when image is uploaded and preview is shown
  // undo icon when no image and previous image has been deleted
  // remove image in preview is deleted
  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel className="flex w-full items-center justify-between gap-12">
          <span>{label}</span>
          <span className="flex shrink-0 items-center gap-4">
            <button type="button">Media Library</button>
            <button type="button">
              <Trash2Icon className="size-4" />
            </button>
            <button type="button" disabled>
              <Undo2Icon className="size-4" />
            </button>
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
          onDelete={handleDelete}
          onBlur={field.handleBlur}
        />
      )}
    </Field>
  )
}
