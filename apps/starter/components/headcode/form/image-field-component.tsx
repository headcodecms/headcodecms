import ImageFieldDropzone from './image-field-dropzone'
import ImageFieldUploadthing from './image-field-uploadthing'

export default function ImageFieldComponent(props: {
  label: string
  description?: string | undefined
  options?: {
    accept?: Record<string, string[]>
    maxFiles?: number
    maxSize?: number
    minSize?: number
  }
}) {
  return process.env.UPLOADTHING_TOKEN ? (
    <ImageFieldUploadthing {...props} />
  ) : (
    <ImageFieldDropzone {...props} />
  )
}
