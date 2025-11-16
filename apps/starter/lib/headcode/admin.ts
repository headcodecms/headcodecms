import {
  addSection as addDBSection,
  addEntry,
  AddEntry,
  AddSection,
  addSectionToEntry,
  deleteEntriesAllSections,
  deleteEntry,
  deleteSections,
  EntriesToSections,
  EntriesToSectionsWithNames,
  Entry,
  getEntries as getDBEntries,
  getEntriesToSections,
  getEntriesToSectionsWithNamesById,
  getEntry,
  Section,
} from '@/db'
import { headcodeConfig } from '@/headcode.config'
import { getConfigEntry } from './config'

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

  await deleteEntriesAllSections(id)
  await deleteSections(sectionIds)
  await deleteEntry(id)
}

export async function addEntryAndSections(entry: AddEntry): Promise<Entry> {
  const newEntry = await addEntry(entry)
  const pinnedSections = []
  const configEntry = getConfigEntry(entry.namespace, entry.key)

  if (configEntry && configEntry.sections.length > 0) {
    for (const section of configEntry.sections) {
      if (section.pinned) {
        pinnedSections.push(section.section.name)
      }
    }
  }

  for (let i = 0; i < pinnedSections.length; i++) {
    const newSection = await addDBSection({
      name: pinnedSections[i],
      data: null,
    })
    await addSectionToEntry({
      entryId: newEntry.id,
      sectionId: newSection.id,
      pos: i,
      pinned: true,
    })
  }

  return newEntry
}

export async function addSection(
  entryId: number,
  section: AddSection,
): Promise<Section> {
  const newSection = await addDBSection(section)
  const entriesToSections = await getEntriesToSections(entryId)
  const maxPos = entriesToSections.reduce(
    (acc: number, curr: EntriesToSections) => (acc > curr.pos ? acc : curr.pos),
    0,
  )

  await addSectionToEntry({
    entryId: entryId,
    sectionId: newSection.id,
    pos: maxPos + 1,
    pinned: false,
  })

  return newSection
}

export async function getValidatedEntriesToSections(
  entryId: number,
): Promise<EntriesToSectionsWithNames[]> {
  const entry = await getEntry(entryId)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }

  const entryToSections = await getEntriesToSectionsWithNamesById(entryId)
  const configEntry = getConfigEntry(entry.namespace, entry.key)

  if (!configEntry) {
    throw new Error(`Config entry not found: ${entry.namespace} / ${entry.key}`)
  }

  const pinnedSections = configEntry.sections.filter(
    (section) => section.pinned,
  )
  const missingPinnedSections = []
  for (const section of pinnedSections) {
    const sectionToSection = entryToSections.find(
      (item) => item.name === section.section.name,
    )
    if (!sectionToSection) {
      missingPinnedSections.push(section)
    }
  }

  let pos = entryToSections.length
  for (let i = 0; i < missingPinnedSections.length; i++) {
    const section = missingPinnedSections[i]
    const newSection = await addDBSection({
      name: section.section.name,
      data: null,
    })
    const newEntryToSection = await addSectionToEntry({
      entryId: entryId,
      sectionId: newSection.id,
      pos,
      pinned: true,
    })
    entryToSections.push({
      ...newEntryToSection,
      name: section.section.name,
    })
    pos++
  }

  return entryToSections
}
