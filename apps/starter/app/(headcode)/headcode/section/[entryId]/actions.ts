'use server'

import type { AddSection, Section } from '@/db'
import { addSection as addDBSection } from '@/lib/headcode/admin'
import { refresh, updateTag } from 'next/cache'

export async function addSection(
  section: AddSection,
): Promise<{ section?: Section; error?: string }> {
  try {
    const newSection = await addDBSection(section)

    updateTag(`/headcode/entries/${section.entryId}`)
    refresh()

    return { section: newSection }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
