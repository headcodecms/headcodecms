'use server'

import { type AddEntry, type Entry } from '@/db'
import {
  addEntryAndSections,
  deleteEntryAndSections,
} from '@/lib/headcode/entries'
import { revalidatePath } from 'next/cache'

export async function addEntry(
  values: AddEntry,
): Promise<{ entry?: Entry; error?: string }> {
  try {
    const entry = await addEntryAndSections(values)
    revalidatePath('/headcode/entries')
    return { entry }
  } catch (error) {
    console.error('error adding entry', error)
    return { error: 'Failed to add entry' }
  }
}

export async function deleteEntry(
  id: number,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await deleteEntryAndSections(id)

    revalidatePath('/headcode/entries')
    return { success: true }
  } catch (error) {
    console.error('error deleting entry', error)
    return {
      error: 'Failed to delete entry',
    }
  }
}
