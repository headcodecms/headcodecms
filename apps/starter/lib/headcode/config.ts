import { SectionReference } from '@/components/headcode/form/form'
import { headcodeConfig } from '@/headcode.config'

export const getConfigEntry = (namespace: string, key?: string | undefined) => {
  const entries = headcodeConfig.entries.filter(
    (item) => item.namespace === namespace,
  )
  if (entries.length === 0) {
    return null
  }
  if (entries.length === 1 && !entries[0].hasOwnProperty('key')) {
    return entries[0]
  }
  return entries.find((item) => item.key === key)
}

export const getConfigSection = (
  namespace: string,
  key: string,
  name: string,
) => {
  const configEntry = getConfigEntry(namespace, key)
  if (!configEntry) {
    throw new Error(`Config entry not found: ${namespace} / ${key}`)
  }
  const configSection = configEntry.sections.find(
    (section) => section.section.name === name,
  )
  if (!configSection) {
    throw new Error(`Config section not found: ${namespace} / ${key} / ${name}`)
  }
  return configSection.section
}

export type SectionName = {
  name: string
  label: string
}
export const getUnpinnedSectionNames = (namespace: string, key: string) => {
  const configEntry = getConfigEntry(namespace, key)
  if (!configEntry) {
    throw new Error(`Config entry not found: ${namespace} / ${key}`)
  }
  const unpinnedSections = configEntry.sections.filter(
    (section: SectionReference) => !section.pinned,
  ) as SectionReference[]
  if (unpinnedSections.length === 0) {
    throw new Error(`No unpinned sections found: ${namespace} / ${key}`)
  }
  return unpinnedSections.map((section) => ({
    name: section.section.name,
    label: section.section.label,
  })) as SectionName[]
}
