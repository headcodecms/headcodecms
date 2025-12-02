import { generateUploadDropzone } from '@uploadthing/react'

import type { OurFileRouter } from '@/app/api/uploadthing/core'

export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
