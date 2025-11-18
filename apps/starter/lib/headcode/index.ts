import {
  getSection as getDBSection,
  getSectionByName as getDBSectionByName,
  type Section,
} from '@/db'
import { getConfigSection } from './config'
import { getSchema } from './form'
import type { Fields, InferSectionData } from './types'

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
    section: parseSection(
      result.entry.namespace,
      result.entry.key,
      result.section.name,
      result.section,
    ),
    isDefault: false,
  }
}
