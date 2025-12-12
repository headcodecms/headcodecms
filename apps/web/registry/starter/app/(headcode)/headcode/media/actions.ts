'use server'

import { getImages } from '@/db'
import { removeStorageImage } from '@/lib/headcode/storage'
import type { ImageValue } from '@/lib/headcode/types'

export async function fetchImages(): Promise<ImageValue[]> {
  try {
    return await getImages()
  } catch (error) {
    console.error('error fetching images', error)
    return []
  }
}

export async function removeImage(
  id: number,
): Promise<{ success?: boolean; error?: string }> {
  return removeStorageImage(id)
}
