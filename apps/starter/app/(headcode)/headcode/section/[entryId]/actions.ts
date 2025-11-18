'use server'

import type { AddSection, Section } from '@/db'
import { addSection as addDBSection } from '@/lib/headcode/admin'
import { updateTag } from 'next/cache'

export async function addSection(
  entryId: number,
  section: AddSection,
): Promise<{ section?: Section; error?: string }> {
  try {
    const newSection = await addDBSection(entryId, section)

    updateTag(`/headcode/entry/${entryId}`)
    return { section: newSection }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
