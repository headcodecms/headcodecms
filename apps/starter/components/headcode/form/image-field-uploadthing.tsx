'use client'

import { useState } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { UploadDropzone } from '@/lib/headcode/uploadthing'
import { useFieldContext } from './app-form'
import { calculateImageProps } from '@/lib/headcode/images'
import type { ImageValue } from '@/lib/headcode/types'
import { ImagePreview } from '@/components/headcode/admin/image-preview'

export default function ImageFieldUploadthing({
  label,
  description,
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
  const [error, setError] = useState<string | null>(null)

  const handleUploadComplete = async (
    res: Array<{
      ufsUrl: string
      url: string
      name: string
      size: number
      type?: string | null
    }>,
  ) => {
    if (res.length === 0) return

    const uploadedFile = res[0]
    setError(null)

    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const imageProps = calculateImageProps(img)
        const fileName = uploadedFile.name.includes('/')
          ? uploadedFile.name.split('/').pop() || uploadedFile.name
          : uploadedFile.name

        const imageValue: ImageValue = {
          src: uploadedFile.ufsUrl,
          alt: fileName.replace(/\.[^/.]+$/, ''),
          width: imageProps.width,
          height: imageProps.height,
          blurDataURL: imageProps.blurDataURL,
          name: fileName,
          type: uploadedFile.type || null,
          size: uploadedFile.size,
        }

        field.handleChange(imageValue)
      }

      img.onerror = () => {
        setError('Failed to load image')
      }

      img.src = uploadedFile.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }

  const handleUploadError = (error: Error) => {
    setError(error.message)
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

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
        {error && <div className="text-destructive mt-1 text-sm">{error}</div>}
      </FieldContent>
      {!imageValue ? (
        <UploadDropzone
          className="ut-label:text-foreground ut-allowed-content:text-muted-foreground ut-upload-icon:text-muted-foreground ut-button:bg-primary ut-button:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 relative inline-flex h-auto w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-md border p-8 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 [&_svg]:pointer-events-none"
          endpoint="imageUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
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
