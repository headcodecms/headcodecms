import { getDb } from '@/headcode/db'
import { storeImage } from '@/headcode/images'
import { consumeUpload } from '@/headcode/services'
import { DEFAULT_IMAGE_MAX_SIZE } from '@/headcode/fields'

// One-time upload URL from generateImageUploadUrl. Body: the image file,
// Content-Type: its type. Returns { storageId } like a Convex upload URL.
export const POST = async (
  req: Request,
  { params }: { params: Promise<{ ticket: string }> },
) => {
  if (!(await consumeUpload(getDb(), (await params).ticket)))
    return Response.json({ error: 'Upload URL expired.' }, { status: 403 })
  const type = req.headers.get('content-type') ?? ''
  if (!type.startsWith('image/'))
    return Response.json({ error: 'Expected an image.' }, { status: 415 })
  const body = await req.arrayBuffer()
  if (body.byteLength > DEFAULT_IMAGE_MAX_SIZE)
    return Response.json({ error: 'Image is too large.' }, { status: 413 })
  return Response.json({ storageId: await storeImage(body, type) })
}
