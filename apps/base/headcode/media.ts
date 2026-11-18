// Uploaded files: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (Vercel),
// else files in MEDIA_DIR (default storage/media; locally, and a volume when
// self-hosted), served by app/media/[file]. The backend keeps the list.
import { del, put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import sharp from 'sharp'
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'

// Resolved at runtime; the build must not trace the folder.
const mediaDir = resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.MEDIA_DIR ?? 'storage/media',
)
const onBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

export const imageTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
}
// Vercel Functions accept request bodies up to 4.5 MB.
export const maxSize = 4 * 1024 * 1024

export const storeMedia = async (file: File) => {
  const pathname = `media/${randomUUID()}${imageTypes[file.type]}`
  if (onBlob()) {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    })
    return { src: blob.url, pathname: blob.url }
  }
  await mkdir(mediaDir, { recursive: true })
  const name = pathname.slice('media/'.length)
  await writeFile(join(mediaDir, name), Buffer.from(await file.arrayBuffer()))
  return { src: `/media/${name}`, pathname: name }
}

export const deleteMedia = async (pathname: string) => {
  if (pathname.startsWith('https://')) await del(pathname)
  else await rm(join(mediaDir, pathname.replace(/[/\\]/g, '')), { force: true })
}

export const readMedia = async (name: string) => {
  const type = Object.entries(imageTypes).find(
    ([, ext]) => ext === extname(name),
  )?.[0]
  if (!type || name.includes('/') || name.includes('\\')) return null
  const body = await readFile(join(mediaDir, name)).catch(() => null)
  return body && { body, type }
}

// Dimensions and a ThumbHash blur placeholder.
export const imageMetadata = async (buffer: Buffer) => {
  const { width, height } = await sharp(buffer).rotate().metadata()
  if (!width || !height) throw new Error('Could not read image dimensions.')
  const { data, info } = await sharp(buffer)
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
