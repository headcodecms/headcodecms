'use server'

import {
  deleteSection as deleteDBSection,
  reorderSections as reorderDBSections,
  updateSection as updateDBSection,
} from '@/db'
import type { Section } from '@/lib/headcode/types'
import { updateEntryCache } from '@/lib/headcode/cache'

export async function reorderSections(
  entryId: number,
  items: { id: number; pos: number }[],
): Promise<{ success?: boolean; error?: string }> {
  try {
    await reorderDBSections(items)

    await updateEntryCache(entryId)

    return { success: true }
  } catch (error) {
    console.error('Error reordering section entries', error)
    return { error: 'Error reordering section entries' }
  }
}

export async function updateSection(
  section: Section,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await updateDBSection(section)

    await updateEntryCache(section.entryId)
    return { success: true }
  } catch (error) {
    console.error('Error updating section', error)
    return { error: 'Error updating section' }
  }
}

export async function deleteSection(
  entryId: number,
  sectionId: number,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await deleteDBSection(sectionId)

    await updateEntryCache(entryId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting section', error)
    return { error: 'Error deleting section' }
  }
}
