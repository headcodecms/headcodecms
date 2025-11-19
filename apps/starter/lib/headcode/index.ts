import {
  Entry,
  getEntries as getDBEntries,
  getSections as getDBSections,
  getSectionsById as getDBSectionsById,
  getEntriesWithSections as getDBEntriesWithSections,
  getSection as getDBSection,
  type Section,
} from '@/db'

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
