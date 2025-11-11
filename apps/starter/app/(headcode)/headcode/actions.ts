'use server'

import { addEntry as addDBEntry, Entry, type AddEntry } from '@/db'
import { deleteEntryAndSections } from '@/lib/headcode/entries'
import { revalidatePath } from 'next/cache'

export async function addEntry(values: AddEntry): Promise<Entry> {
  const entry = await addDBEntry(values)

  // add pinned sections to entry

  revalidatePath('/headcode/entries')
  return entry
}

export async function deleteEntry(id: number) {
  try {
    await deleteEntryAndSections(id)

    revalidatePath('/headcode/entries')
    return { success: true }
  } catch (error) {
    console.error('error deleting entry', error)
    return {
      success: false,
      error: 'Failed to delete entry',
    }
  }
}
