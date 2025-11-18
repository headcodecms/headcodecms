'use server'

import {
  deleteSection as deleteDBSection,
  reorderSections as reorderDBSections,
  Section,
  updateSection as updateDBSection,
} from '@/db'
import { updateTag } from 'next/cache'

export async function reorderSections(
  entryId: number,
  items: { id: number; pos: number }[],
): Promise<{ success?: boolean; error?: string }> {
  try {
    await reorderDBSections(items)

    updateTag(`/headcode/entries/${entryId}`)
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

    updateTag(`/headcode/entries/${section.entryId}`)
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

    updateTag(`/headcode/entries/${entryId}`)

    return { success: true }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
