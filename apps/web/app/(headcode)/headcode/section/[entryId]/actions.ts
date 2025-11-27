'use server'

import { getEntry } from '@/db'
import type { AddSection, Section } from '@/lib/headcode/types'
import { addSection as addDBSection } from '@/lib/headcode/admin'
import { refresh, updateTag } from 'next/cache'

export async function addSection(
  section: AddSection,
): Promise<{ section?: Section; error?: string }> {
  try {
    const newSection = await addDBSection(section)
    const entry = await getEntry(section.entryId)

    updateTag(`/headcode/entries/${section.entryId}`)
    updateTag(`/headcode/entries/${entry?.namespace}/${entry?.key}`)
    refresh()

    return { section: newSection }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
