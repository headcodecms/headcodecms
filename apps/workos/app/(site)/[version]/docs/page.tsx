import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import { getHeadcodeGlobal, getMeta } from '@/app/(site)/_lib/headcode'
import { firstImage, pageMetadata } from '@/app/(site)/_lib/seo'
import { RenderSections } from '@/app/(site)/_sections'

export const generateMetadata = async (): Promise<Metadata> => {
  const docs = await getHeadcodeGlobal(await siteVersion(), 'docs')
  const meta = docs && getMeta(docs)
  return pageMetadata({
    title: meta ? `${meta.title} - Headcode` : 'Documentation - Headcode',
    description: meta?.description,
    path: '/docs',
    image: docs && firstImage(docs.sections),
  })
}

export default async function DocsPage() {
  const docs = await getHeadcodeGlobal(await siteVersion(), 'docs')
  if (!docs) notFound()
  return <RenderSections entry={docs.entry} sections={docs.sections} />
}
