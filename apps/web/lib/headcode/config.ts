import type { SectionName, SectionReference } from './types'
import { headcodeConfig } from '@/headcode.config'

export const getVersion = () => headcodeConfig.version
export const getClone = () => headcodeConfig.clone
export const hasClone = () => headcodeConfig.clone !== undefined

export const getConfigEntry = (namespace: string, key?: string | undefined) => {
  const entries = headcodeConfig.entries.filter(
    (item) => item.namespace === namespace,
  )
  if (entries.length === 0) {
    return null
  }
  if (entries.length === 1 && !('key' in entries[0])) {
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

export const getConfigSectionNames = (
  namespace: string,
  key: string,
  pinned: boolean,
) => {
  const configEntry = getConfigEntry(namespace, key)
  if (!configEntry) {
    throw new Error(`Config entry not found: ${namespace} / ${key}`)
  }

  const configSections = configEntry.sections.filter(
    (section: SectionReference) => (pinned ? section.pinned : !section.pinned),
  ) as SectionReference[]

  return configSections.map((section) => ({
    name: section.section.name,
    label: section.section.label,
  })) as SectionName[]
}
