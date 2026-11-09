// Seam: image storage and metadata. Cloudflare stores files in R2 (binding
// MEDIA) and reads dimensions with the Images binding; apps/local uses files.
import { env } from 'cloudflare:workers'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'

// Files are served by app/media/[key]/route.ts.
export const imageSrc = (storageId: string) => `/media/${storageId}`

export const storeImage = async (body: ArrayBuffer, type: string) => {
  const ext = type.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin'
  const storageId = `${crypto.randomUUID()}.${ext}`
  await env.MEDIA.put(storageId, body, { httpMetadata: { contentType: type } })
  return storageId
}

export const readImage = async (storageId: string) => {
  const object = await env.MEDIA.get(storageId)
  if (!object) return null
  return {
    body: object.body,
    type: object.httpMetadata?.contentType ?? 'application/octet-stream',
    size: object.size,
  }
}

export const deleteStoredImage = (storageId: string) =>
  env.MEDIA.delete(storageId)

// Dimensions and ThumbHash blur placeholder.
export const imageMetadata = async (buffer: ArrayBuffer) => {
  const stream = () => new Blob([buffer]).stream()
  const info = await env.IMAGES.info(stream())
  if (!('width' in info) || !info.width || !info.height)
    throw new Error('Could not read image dimensions.')
  const { width, height } = info
  const scale = Math.min(1, 100 / width, 100 / height)
  const w = Math.max(1, Math.round(width * scale))
  const blurDataURL = await env.IMAGES.input(stream())
    .transform({ width: w, fit: 'scale-down' })
    .output({ format: 'rgba' })
    .then(async (result) => {
      const data = new Uint8Array(await result.response().arrayBuffer())
      return thumbHashToDataURL(
        rgbaToThumbHash(w, data.byteLength / (w * 4), data),
      )
    })
    .catch((error: unknown) => {
      // Local `vite dev` cannot output raw RGBA; use a grey placeholder there.
      if (!import.meta.env.DEV) throw error
      return thumbHashToDataURL(rgbaToThumbHash(1, 1, [128, 128, 128, 255]))
    })
  return { width, height, blurDataURL }
}

// Resized copy for /media/<key>?w=<width> (responsive images on the site).
export const transformImage = async (
  body: ReadableStream,
  {
    width,
    quality,
    format,
  }: { width: number; quality: number; format: string },
) =>
  (
    await env.IMAGES.input(body)
      .transform({ width, fit: 'scale-down' })
      .output({
        format: format as 'image/avif' | 'image/webp' | 'image/jpeg',
        quality,
      })
  ).response()
