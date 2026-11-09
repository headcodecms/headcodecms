// Seam: image storage and metadata. apps/local stores files under
// MEDIA_DIR (default data/media) and uses sharp; apps/cloudflare uses R2 and
// the Images binding with the same functions.
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'

const mediaDir = process.env.MEDIA_DIR ?? 'data/media'
const types: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

// Keys are generated (uuid.ext); anything else is rejected.
const filePath = (storageId: string) => {
  if (!/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(storageId))
    throw new Error('Invalid storage id.')
  return join(mediaDir, storageId)
}

// Files are served by app/media/[key]/route.ts.
export const imageSrc = (storageId: string) => `/media/${storageId}`

export const storeImage = async (body: ArrayBuffer, type: string) => {
  const ext = type.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin'
  const storageId = `${crypto.randomUUID()}.${ext}`
  await mkdir(mediaDir, { recursive: true })
  await writeFile(filePath(storageId), new Uint8Array(body))
  return storageId
}

export const readImage = async (storageId: string) => {
  const path = (() => {
    try {
      return filePath(storageId)
    } catch {
      return null
    }
  })()
  const info = path && (await stat(path).catch(() => null))
  if (!path || !info) return null
  return {
    body: Readable.toWeb(
      (await import('node:fs')).createReadStream(path),
    ) as ReadableStream,
    type: types[storageId.split('.').pop() ?? ''] ?? 'application/octet-stream',
    size: info.size,
  }
}

export const deleteStoredImage = async (storageId: string) => {
  await rm(filePath(storageId), { force: true })
  await rm(join(mediaDir, 'resized', storageId.split('.')[0]), {
    recursive: true,
    force: true,
  })
}

// Dimensions and ThumbHash blur placeholder.
export const imageMetadata = async (buffer: ArrayBuffer) => {
  const input = Buffer.from(buffer)
  const { width, height } = await sharp(input).rotate().metadata()
  if (!width || !height) throw new Error('Could not read image dimensions.')
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: 100,
      height: 100,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const blurDataURL = thumbHashToDataURL(
    rgbaToThumbHash(info.width, info.height, data),
  )
  return { width, height, blurDataURL }
}

// Resized copy for /media/<key>?w=<width>, cached as a file under resized/.
export const transformImage = async (
  storageId: string,
  {
    width,
    quality,
    format,
  }: { width: number; quality: number; format: string },
) => {
  const ext = format.split('/')[1]
  const dir = join(mediaDir, 'resized', storageId.split('.')[0])
  const file = join(dir, `${width}-${quality}.${ext}`)
  const headers = { 'Content-Type': format }
  const cached = await readFile(file).catch(() => null)
  if (cached) return new Response(new Uint8Array(cached), { headers })
  const output = await sharp(await readFile(filePath(storageId)))
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .toFormat(ext as 'avif' | 'webp' | 'jpeg', { quality })
    .toBuffer()
  await mkdir(dir, { recursive: true })
  await writeFile(file, output)
  return new Response(new Uint8Array(output), { headers })
}
