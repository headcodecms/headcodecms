'use server'

import fs from 'fs'
import path from 'path'
import { put } from '@vercel/blob'
import { generateUniqueImageName } from '@/lib/headcode/images'

export async function uploadFile(
  file: File,
): Promise<
  { name: string; url: string; type: string; size: number } | { error: string }
> {
  return process.env.BLOB_READ_WRITE_TOKEN
    ? uploadVercelBlob(file)
    : uploadLocalFile(file)
}

async function uploadVercelBlob(
  file: File,
): Promise<
  { name: string; url: string; type: string; size: number } | { error: string }
> {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  })

  return {
    name: file.name,
    url: blob.url,
    type: file.type,
    size: file.size,
  }
}

async function uploadLocalFile(
  file: File,
): Promise<
  { name: string; url: string; type: string; size: number } | { error: string }
> {
  try {
    const storageFolder = process.env.FILE_STORAGE_FOLDER ?? 'public/storage'
    if (!fs.existsSync(storageFolder)) {
      fs.mkdirSync(storageFolder, { recursive: true })
    }

    const name = generateUniqueImageName(file.name)
    const filePath = path.join(storageFolder, name)
    const buffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(buffer))

    const url = `${storageFolder}/${name}`.replace('public', '')

    return {
      name: name,
      url,
      type: file.type,
      size: file.size,
    }
  } catch (error) {
    console.error('Error uploading file', error)
    return { error: 'Error uploading file' }
  }
}
