import { requireRole } from '@/lib/auth'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { role, email } = await requireRole(['user', 'admin'])
      if (!role) throw new UploadThingError('Unauthorized')

      return { email }
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.email }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
