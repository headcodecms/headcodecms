import type { NextRequest } from 'next/server'

import { callTool, cookie, ToolError } from '@/headcode/admin'
import {
  deleteMedia,
  imageMetadata,
  imageTypes,
  maxSize,
  storeMedia,
} from '@/headcode/media'

// Upload (form field `file`): stores the image, then registers it with the
// backend, which decides whether the user may; a refused upload is deleted.
export const POST = async (req: NextRequest) => {
  const token = req.cookies.get(cookie.access)?.value
  if (!token) return Response.json({ error: 'Not signed in.' }, { status: 401 })
  const file = (await req.formData()).get('file')
  if (!(file instanceof File) || !imageTypes[file.type])
    return Response.json(
      { error: 'Upload a JPEG, PNG, WebP, AVIF or GIF image.' },
      { status: 400 },
    )
  if (file.size > maxSize)
    return Response.json(
      { error: 'Images can be up to 4 MB.' },
      { status: 400 },
    )
  const metadata = await imageMetadata(Buffer.from(await file.arrayBuffer()))
  const { src, pathname } = await storeMedia(file)
  try {
    const result = await callTool(token, 'media_add', {
      src,
      pathname,
      content_type: file.type,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      blur_data_url: metadata.blurDataURL,
      alt: file.name.replace(/\.[^.]+$/, ''),
    })
    return Response.json({ result })
  } catch (error) {
    await deleteMedia(pathname)
    if (!(error instanceof ToolError)) throw error
    return Response.json({ error: error.message }, { status: 400 })
  }
}
