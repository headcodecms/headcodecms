import {
  getEntries as getDBEntries,
  getSections as getDBSections,
  getSectionsById as getDBSectionsById,
  getEntriesWithSections as getDBEntriesWithSections,
  getSection as getDBSection,
} from '@/db'
import type { Entry, Section } from './types'

export async function getSectionsById(entryId: number): Promise<Section[]> {
  return await getDBSectionsById(entryId)
}

export async function getSections(
  namespace: string,
  key: string,
  filter?: { name?: string; pinned?: boolean } | undefined,
): Promise<Section[]> {
  return await getDBSections(namespace, key, filter)
}

export async function getEntries(namespace: string): Promise<Entry[]> {
  return await getDBEntries(namespace)
}

export async function getEntriesWithSections(
  namespace: string,
  filter?: { name?: string; pinned?: boolean } | undefined,
): Promise<{ entry: Entry; section: Section }[]> {
  return await getDBEntriesWithSections(namespace, filter)
}

export async function getSectionById(
  id: number,
): Promise<{ section: Section } | null> {
  return await getDBSection(id)
}

export async function getSection(
  namespace: string,
  key: string,
  name: string,
  pinned: boolean = false,
): Promise<Section | null> {
  const sections = await getDBSections(namespace, key, { name, pinned })
  return sections.length > 0 ? sections[0] : null
}
