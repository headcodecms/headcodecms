import {
  addSection as addDBSection,
  addEntry,
  deleteEntry,
  deleteSections,
  getEntries as getDBEntries,
  getEntry,
  getSectionsById,
} from '@/db'
import type {
  AddEntry,
  AddSection,
  Entry,
  Section,
  UIEntry,
  UIEntryType,
} from './types'
import { headcodeConfig } from '@/headcode.config'
import { getConfigSectionNames } from './config'

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
  await deleteSections(id)
  await deleteEntry(id)
}

export async function addEntryAndSections(entry: AddEntry): Promise<Entry> {
  const newEntry = await addEntry(entry)
  const pinnedSections = getConfigSectionNames(entry.namespace, entry.key, true)

  for (let i = 0; i < pinnedSections.length; i++) {
    await addDBSection({
      name: pinnedSections[i].name,
      pos: i,
      entryId: newEntry.id,
      data: null,
      pinned: true,
    })
  }

  return newEntry
}

export async function addSection(section: AddSection): Promise<Section> {
  const sections = await getSectionsById(section.entryId)
  const maxPos = sections.reduce(
    (acc: number, curr: Section) => (acc > curr.pos ? acc : curr.pos),
    -1,
  )

  const newSection = await addDBSection({
    ...section,
    pos: maxPos + 1,
  })

  return newSection
}

export async function getValidatedSections(
  entryId: number,
): Promise<Section[]> {
  const entry = await getEntry(entryId)
  const sections = await getSectionsById(entryId)
  if (!entry) {
    throw new Error(`Entry not found: ${entryId}`)
  }

  const pinnedSections = getConfigSectionNames(entry.namespace, entry.key, true)
  const missingPinnedSections = []
  for (const pinnedSection of pinnedSections) {
    const section = sections.find((item) => item.name === pinnedSection.name)
    if (!section) {
      missingPinnedSections.push(pinnedSection)
    }
  }

  let pos = sections.length
  for (let i = 0; i < missingPinnedSections.length; i++) {
    const missingPinnedSection = missingPinnedSections[i]
    const newSection = await addDBSection({
      name: missingPinnedSection.name,
      pos,
      pinned: true,
      entryId,
      data: null,
    })

    sections.push(newSection)
    pos++
  }

  return sections
}
