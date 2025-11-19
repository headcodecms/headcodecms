import {
  Entry,
  getEntries as getDBEntries,
  getSections as getDBSections,
  getSectionsById as getDBSectionsById,
  getEntriesWithSections as getDBEntriesWithSections,
  getSection as getDBSection,
  type Section,
} from '@/db'
import { getSchema, getDefaultValues } from './form'
import type { Fields, InferSectionData } from './types'

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

export async function getSection(
  id: number,
): Promise<{ section: Section } | null> {
  return await getDBSection(id)
}

export function parseSectionData<F extends Fields>(
  fields: F,
  sectionData: unknown,
): { data: InferSectionData<F>; isDefault: boolean } {
  const schema = getSchema(fields)
  const defaultValues = getDefaultValues(fields)

  if (sectionData === null || sectionData === undefined) {
    const parsedDefaults = schema.parse(defaultValues)
    return {
      data: parsedDefaults as InferSectionData<F>,
      isDefault: true,
    }
  }

  if (typeof sectionData === 'object') {
    const filteredData: Record<string, unknown> = {}
    Object.keys(fields).forEach((key) => {
      if (key in sectionData) {
        filteredData[key] = (sectionData as Record<string, unknown>)[key]
      } else {
        filteredData[key] = defaultValues[key]
      }
    })

    try {
      const parsed = schema.parse(filteredData)
      return {
        data: parsed as InferSectionData<F>,
        isDefault: false,
      }
    } catch {
      console.error('Validation failed, using default values', filteredData)
      const parsedDefaults = schema.parse(defaultValues)
      return {
        data: parsedDefaults as InferSectionData<F>,
        isDefault: true,
      }
    }
  }

  if (typeof sectionData === 'string') {
    let parsedData: unknown
    try {
      parsedData = JSON.parse(sectionData)
    } catch {
      console.error('JSON parsing failed, using default values', sectionData)
      const parsedDefaults = schema.parse(defaultValues)
      return {
        data: parsedDefaults as InferSectionData<F>,
        isDefault: true,
      }
    }

    const filteredData: Record<string, unknown> = {}
    Object.keys(fields).forEach((key) => {
      if (parsedData && typeof parsedData === 'object' && key in parsedData) {
        filteredData[key] = (parsedData as Record<string, unknown>)[key]
      } else {
        filteredData[key] = defaultValues[key]
      }
    })

    try {
      const parsed = schema.parse(filteredData)
      return {
        data: parsed as InferSectionData<F>,
        isDefault: false,
      }
    } catch {
      console.error('Validation failed, using default values', filteredData)
      const parsedDefaults = schema.parse(defaultValues)
      return {
        data: parsedDefaults as InferSectionData<F>,
        isDefault: true,
      }
    }
  }

  const parsedDefaults = schema.parse(defaultValues)
  return {
    data: parsedDefaults as InferSectionData<F>,
    isDefault: true,
  }
}

// const parseSection = (
//   namespace: string,
//   key: string,
//   name: string,
//   section: Section | null,
// ) => {
//   const sectionConfig = getConfigSection(namespace, key, name)
//   const schema = getSchema(sectionConfig.fields)
//   return schema.parse({
//     ...(section?.data ?? {}),
//   }) as InferSectionData<typeof sectionConfig.fields>
// }

// export async function getSection<F extends Fields>(
//   id: number | { namespace: string; key: string; name: string },
// ): Promise<{
//   section: InferSectionData<F>
//   isDefault: boolean
// }> {
//   const result =
//     typeof id === 'number'
//       ? await getDBSection(id)
//       : await getDBSectionByName(id.namespace, id.key, id.name)
//   if (result === null) {
//     throw new Error(`Section not found: ${id}`)
//   }
//   if (!result) {
//     // parse default values
//   }

//   return {
//     // @ts-expect-error - parseSection returns an InferSectionData<F>
//     section: parseSection(
//       result.entry.namespace,
//       result.entry.key,
//       result.section.name,
//       result.section,
//     ),
//     isDefault: false,
//   }
// }
