'use server'

import {
  deleteSection as deleteDBSection,
  deleteEntriesToSections,
  EntriesToSections,
  reorderSectionEntries as reorderDBSectionEntries,
  Section,
  updateSection as updateDBSection,
} from '@/db'
import { updateTag } from 'next/cache'

export async function reorderSectionEntries(
  entriesToSections: Pick<EntriesToSections, 'entryId' | 'sectionId' | 'pos'>[],
): Promise<{ success?: boolean; error?: string }> {
  try {
    await reorderDBSectionEntries(entriesToSections)

    updateTag(`/headcode/entry/${entriesToSections[0].entryId}`)
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

    updateTag(`/headcode/section/${section.id}`)
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
    console.log('deleteSection', entryId, sectionId)

    await deleteEntriesToSections(entryId, sectionId)
    await deleteDBSection(sectionId)

    updateTag(`/headcode/section/${entryId}`)

    return { success: true }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
