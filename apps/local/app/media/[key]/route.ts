import { readImage, transformImage } from '@/headcode/images'
import { mediaWidths } from '@/headcode/utils'

const cacheControl = 'public, max-age=31536000, immutable'

// Serves uploaded images. Keys never change, so responses are cached for a
// year. `?w=<width>` returns a resized AVIF/WebP/JPEG (see mediaSrcSet).
export const GET = async (
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) => {
  const { key } = await params
  const url = new URL(req.url)
  const width = Number(url.searchParams.get('w'))
  const image = await readImage(key)
  if (!image) return new Response('Not found', { status: 404 })
  if (!width || image.type === 'image/svg+xml' || image.type === 'image/gif')
    return new Response(image.body, {
      headers: {
        'Content-Type': image.type,
        'Content-Length': String(image.size),
        'Cache-Control': cacheControl,
      },
    })

  // Resizing reads the file itself.
  await image.body.cancel()
  if (!mediaWidths.includes(width))
    return new Response('Unsupported width', { status: 400 })
  const accept = req.headers.get('accept') ?? ''
  const format = accept.includes('image/avif')
    ? 'image/avif'
    : accept.includes('image/webp')
      ? 'image/webp'
      : 'image/jpeg'

  // One cached copy per key, width, and format (Cache API where it exists;
  // apps/local caches resized files in its images seam).
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default
  const cacheKey = new Request(
    new URL(`/media/${key}?w=${width}&f=${format}`, url),
  )
  const cached = await cache?.match(cacheKey)
  if (cached) return cached

  const resized = await transformImage(key, {
    width,
    quality: 75,
    format,
  }).catch(() => null)
  if (!resized) return new Response('Could not resize image', { status: 500 })
  const response = new Response(resized.body, {
    headers: {
      'Content-Type': resized.headers.get('content-type') ?? format,
      'Cache-Control': cacheControl,
      Vary: 'Accept',
    },
  })
  await cache?.put(cacheKey, response.clone())
  return response
}
