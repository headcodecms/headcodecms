'use cache'
cacheTag('/headcode/entries')

import {
  DocsMetaData,
  docsMetaSection,
} from '@/app/(site)/docs/[slug]/docs-meta'
import { getEntriesWithSections } from '@/lib/headcode'
import { parseSectionData } from '@/lib/headcode/data'
import { cacheTag } from 'next/cache'

export async function DocsMobile() {
  const entries = await getEntriesWithSections('docs', { name: 'docs-meta' })
  const metas = entries
    .map((entry) => {
      const data = entry.section.data as DocsMetaData
      const parsedData = parseSectionData(docsMetaSection.fields, data)
      return { ...parsedData.data, slug: entry.entry.key }
    })
    .sort((a, b) => (a.order < b.order ? -1 : 1))

  console.log('metas', metas)

  return <div>Docs Mobile</div>
}
