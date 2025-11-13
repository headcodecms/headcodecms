'use server'

import {
  deleteSection as deleteDBSection,
  deleteEntriesToSections,
  Section,
  updateSection as updateDBSection,
} from '@/db'

export async function updateSection(
  section: Section,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await updateDBSection(section)
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
    await deleteEntriesToSections(entryId, sectionId)
    await deleteDBSection(sectionId)

    return { success: true }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
