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

export async function getSections(
  entryId: number | { namespace: string; key: string },
): Promise<EntriesToSectionsWithNames[]> {
  return typeof entryId === 'number'
    ? await getEntriesToSectionsWithNamesById(entryId)
    : await getEntriesToSectionsWithNames(entryId.namespace, entryId.key)
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
    ...(section?.data ?? {}),
  }) as InferSectionData<typeof sectionConfig.fields>
}

export async function getSection<F extends Fields>(
  id: number | { namespace: string; key: string; name: string },
): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}> {
  const result =
    typeof id === 'number'
      ? await getDBSection(id)
      : await getDBSectionByName(id.namespace, id.key, id.name)
  if (result === null) {
    throw new Error(`Section not found: ${id}`)
  }
  if (!result) {
    // parse default values
  }

  return {
    section: parseSection(result.namespace, result.key, result.name, result),
    isDefault: false,
  }
}
