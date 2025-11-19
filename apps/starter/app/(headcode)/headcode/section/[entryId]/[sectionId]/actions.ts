'use server'

import {
  deleteSection as deleteDBSection,
  getEntry,
  reorderSections as reorderDBSections,
  updateSection as updateDBSection,
} from '@/db'
import type { Section } from '@/lib/headcode/types'
import { updateTag } from 'next/cache'

export async function reorderSections(
  entryId: number,
  items: { id: number; pos: number }[],
): Promise<{ success?: boolean; error?: string }> {
  try {
    await reorderDBSections(items)
    const entry = await getEntry(entryId)

    updateTag(`/headcode/entries/${entryId}`)
    updateTag(`/headcode/entries/${entry?.namespace}/${entry?.key}`)

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
    const entry = await getEntry(section.entryId)

    updateTag(`/headcode/entries/${section.entryId}`)
    updateTag(`/headcode/entries/${entry?.namespace}/${entry?.key}`)
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
    const entry = await getEntry(entryId)

    updateTag(`/headcode/entries/${entryId}`)
    updateTag(`/headcode/entries/${entry?.namespace}/${entry?.key}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
