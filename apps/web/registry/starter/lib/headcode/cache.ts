import { getEntry, getSectionsById } from '@/db'
import { updateTag } from 'next/cache'

export async function updateEntryCache(entryId: number): Promise<void> {
  const entry = await getEntry(entryId)
  
  updateTag(`/headcode/entries/${entryId}`)
  if (entry?.namespace && entry?.key) {
    updateTag(`/headcode/entries/${entry.namespace}/${entry.key}`)
  }
  
  const sections = await getSectionsById(entryId)
  for (const section of sections) {
    updateTag(`/headcode/sections/${section.id}`)
  }
}

export function updateSectionCache(sectionId: number): void {
  updateTag(`/headcode/sections/${sectionId}`)
}

