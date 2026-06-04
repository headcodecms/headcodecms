import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderSections } from '../_sections'
import { getHeadcodeGlobal, getMeta } from '../_lib/headcode'

export const generateMetadata = async (): Promise<Metadata> => {
  const docs = await getHeadcodeGlobal('docs')
  const meta = docs ? getMeta(docs) : null

  return {
    title: meta ? `${meta.title} - Headcode` : 'Documentation - Headcode',
    description: meta?.description,
  }
}

export default async function DocsPage() {
  const docs = await getHeadcodeGlobal('docs')
  if (!docs) notFound()

  return <RenderSections entry={docs.entry} sections={docs.sections} />
}
