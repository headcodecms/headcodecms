import { headcodeConfig } from '@/headcode.config'
import {
  getEntries as getDBEntries,
  getEntriesToSections,
  deleteEntriesToSections,
  deleteSections,
  deleteEntry,
  addEntry,
  AddEntry,
  Entry,
  addSection,
  addSectionToEntry,
} from '@/db'

export type UIEntryType = {
  namespace: string
  dynamic: boolean
}

export type UIEntry = {
  id?: number
  namespace: string
  key: string
  isDynamic: boolean
}

export async function getEntries() {
  const entryTypes: UIEntryType[] = []
  const entries: UIEntry[] = []

  for (const entry of headcodeConfig.entries) {
    const namespace = entry.namespace
    const key = entry.key
    const dynamic = entry.key ? false : true
    const type = entryTypes.find((type) => type.namespace === namespace)

    if (type) {
      if (type.dynamic !== dynamic) {
        throw new Error(
          `Error in headcode.config.ts: Dynamic and static entries cannot be mixed in the same namespace: ${namespace}`,
        )
      }
    } else {
      entryTypes.push({
        namespace,
        dynamic,
      })
    }

    if (!dynamic) {
      entries.push({
        namespace,
        key: key as string,
        isDynamic: false,
      })
    }
  }

  const dbEntries = await getDBEntries()
  const emptyEntries = dbEntries.length === 0

  for (const entry of dbEntries) {
    const id = entry.id
    const namespace = entry.namespace
    const key = entry.key
    const type = entryTypes.find((type) => type.namespace === namespace)

    if (type) {
      const existingEntry = entries.find(
        (item) => item.namespace === namespace && item.key === key,
      )

      if (type.dynamic && !existingEntry) {
        entries.push({
          id,
          namespace,
          key,
          isDynamic: true,
        })
      }

      if (!type.dynamic && existingEntry) {
        existingEntry.id = id
      }
    }
  }

  return { entryTypes, entries, emptyEntries }
}

export async function deleteEntryAndSections(id: number): Promise<void> {
  const entryToSections = await getEntriesToSections(id)
  const sectionIds = entryToSections.map((ets) => ets.sectionId)

  await deleteEntriesToSections(id)
  await deleteSections(sectionIds)
  await deleteEntry(id)
}

export async function addEntryAndSections(values: AddEntry): Promise<Entry> {
  const entry = await addEntry(values)
  const pinnedSections = []
  const configEntry = headcodeConfig.entries.find(
    (entry) => entry.namespace === values.namespace && entry.key === values.key,
  )

  if (configEntry && configEntry.sections.length > 0) {
    for (const section of configEntry.sections) {
      if (section.pinned) {
        pinnedSections.push(section.section.name)
      }
    }
  }

  for (let i = 0; i < pinnedSections.length; i++) {
    const newSection = await addSection({
      name: pinnedSections[i],
      data: null,
    })
    await addSectionToEntry({
      entryId: entry.id,
      sectionId: newSection.id,
      pos: i,
      pinned: true,
    })
  }

  return entry
}
