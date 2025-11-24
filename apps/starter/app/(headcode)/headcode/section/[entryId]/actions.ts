'use server'

import type { AddSection, Section } from '@/lib/headcode/types'
import { addSection as addDBSection } from '@/lib/headcode/admin'
import { invalidateEntryCache } from '@/lib/headcode/cache'
import { refresh } from 'next/cache'

export async function addSection(
  section: AddSection,
): Promise<{ section?: Section; error?: string }> {
  try {
    const newSection = await addDBSection(section)
    await invalidateEntryCache(section.entryId)
    refresh()

    return { section: newSection }
  } catch (error) {
    console.error('Error adding section', error)
    return { error: 'Error adding section' }
  }
}
