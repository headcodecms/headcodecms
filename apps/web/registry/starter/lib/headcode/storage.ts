import { deleteImage } from '@/db'
import { generateUniqueImageName } from '@/lib/headcode/images'
import { StorageData } from '@/lib/headcode/types'
import { del, put } from '@vercel/blob'
import fs from 'fs'
import path from 'path'

const services = {
  vercelBlob: 'vercel_blob',
  file: 'file',
}

export async function removeStorageImage(
  id: number,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const storageDelete =
      process.env.STORAGE_DELETE?.toLowerCase() === 'true' || false

    const deletedImage = await deleteImage(id)
    if (deletedImage && storageDelete) {
      const service = deletedImage.service
      const serviceId = deletedImage.serviceId

      if (serviceId && service === services.vercelBlob) {
        await del(serviceId, { token: process.env.BLOB_READ_WRITE_TOKEN })
      } else if (serviceId && service === services.file) {
        if (fs.existsSync(serviceId)) {
          fs.unlinkSync(serviceId)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('error deleting image', error)
    return {
      error: 'Failed to delete image',
    }
  }
}

export async function uploadImage(file: File): Promise<StorageData> {
  return process.env.BLOB_READ_WRITE_TOKEN
    ? uploadVercelBlob(file)
    : uploadLocalFile(file)
}

async function uploadVercelBlob(file: File): Promise<StorageData> {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  })

  return {
    name: file.name,
    url: blob.url,
    type: file.type,
    size: file.size,
    service: services.vercelBlob,
    serviceId: blob.pathname,
  }
}

async function uploadLocalFile(file: File): Promise<StorageData> {
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
      service: services.file,
      serviceId: filePath,
    }
  } catch (error) {
    console.error('Error uploading file', error)
    return { error: 'Error uploading file' }
  }
}
