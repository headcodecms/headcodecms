'use server'

import { cloneVersion as cloneDBVersion } from '@/db'
import type { AddEntry, Entry } from '@/lib/headcode/types'
import {
  addEntryAndSections,
  deleteEntryAndSections,
} from '@/lib/headcode/admin'
import { updateTag } from 'next/cache'

export async function addEntry(
  values: AddEntry,
): Promise<{ entry?: Entry; error?: string }> {
  try {
    const entry = await addEntryAndSections(values)

    updateTag('/headcode/entries')
    return { entry }
  } catch (error) {
    console.error('error adding entry', error)
    return { error: 'Error adding entry. Namespace or key already exists.' }
  }
}

export async function deleteEntry(
  id: number,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await deleteEntryAndSections(id)

    updateTag('/headcode/entries')
    return { success: true }
  } catch (error) {
    console.error('error deleting entry', error)
    return {
      error: 'Failed to delete entry',
    }
  }
}

export async function cloneVersion(
  clone: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await cloneDBVersion(clone)
    updateTag('/headcode/entries')

    return { success: true }
  } catch (error) {
    console.error('error cloning database', error)
    return { error: 'Failed to clone database' }
  }
}
