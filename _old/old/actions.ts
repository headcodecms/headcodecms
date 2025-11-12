'use server'

import { revalidatePath } from 'next/cache'
import { SectionEntry } from './section-form'

export async function reorderSectionEntries(sectionEntries: SectionEntry[]) {
  console.log('reordering section entries', sectionEntries)
  await new Promise((resolve) => setTimeout(resolve, 1000))
  revalidatePath(`/headcode/section/${sectionEntries[0].entryId}`)

  return { success: true }
}

export async function addSection(values: unknown) {
  console.log('adding section', values)
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { success: true }
}
