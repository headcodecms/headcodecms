'use server'

import { addImage as addDBImage } from '@/db'
import { uploadImage } from '@/lib/headcode/storage'
import { AddImage, ImageValue, StorageData } from '@/lib/headcode/types'

export async function uploadFile(file: File): Promise<StorageData> {
  return uploadImage(file)
}

export async function addImage(image: AddImage): Promise<ImageValue> {
  const imageValue = await addDBImage(image)
  return imageValue
}
