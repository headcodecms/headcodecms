'use server'

import fs from 'fs'
import path from 'path'
import { put } from '@vercel/blob'

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

function generateUniqueImageName(name: string) {
  const cleanName = name.replace(/\s+/g, '-').toLowerCase()
  const suffix = Math.floor(Math.random() * Date.now()).toString(36)
  const index = cleanName.lastIndexOf('.')

  return index < 0
    ? `${cleanName}-${suffix}`
    : `${cleanName.slice(0, index)}-${suffix}${cleanName.slice(index)}`
}
