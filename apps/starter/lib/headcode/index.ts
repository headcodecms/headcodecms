import {
  EntriesToSectionsWithNames,
  type Entry,
  EntryWithSection,
  getEntries as getDBEntries,
  getEntriesToSectionsWithNames,
  getEntriesToSectionsWithNamesById,
  getSectionByName as getDBSectionByName,
  getSection as getDBSection,
  type Section,
} from '@/db'
import type { Fields, InferSectionData } from './types'
import { getSchema } from './form'
import { getConfigSection } from './config'

export async function getEntriesWithSection(
  namespace: string,
  name: string,
): Promise<EntryWithSection[]> {
  return await getEntriesWithSection(namespace, name)
}

export async function getEntries(namespace: string): Promise<Entry[]> {
  return await getDBEntries(namespace)
}

export async function getSectionsById(
  entryId: number,
): Promise<EntriesToSectionsWithNames[]> {
  return await getEntriesToSectionsWithNamesById(entryId)
}

export async function getSections(
  namespace: string,
  key: string,
): Promise<EntriesToSectionsWithNames[]> {
  return await getEntriesToSectionsWithNames(namespace, key)
}

const parseSection = (
  namespace: string,
  key: string,
  name: string,
  section: Section | null,
) => {
  const sectionConfig = getConfigSection(namespace, key, name)
  const schema = getSchema(sectionConfig.fields)
  return schema.parse({
    ...section.data,
  }) as InferSectionData<F>
}

export async function getSectionByName<F extends Fields>(
  namespace: string,
  key: string,
  name: string,
): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}> {
  const section = await getDBSectionByName(namespace, key, name)
  return {
    section: parseSection(namespace, key, name, section),
    isDefault: section === null,
  }
}

export async function getSection<F extends Fields>(
  id: number,
): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}> {
  const result = await getDBSection(id)
  if (!result) {
    throw new Error(`Section not found: ${id}`)
  }

  return {
    section: parseSection(result.namespace, result.key, result.name, result),
    isDefault: false,
  }
}
