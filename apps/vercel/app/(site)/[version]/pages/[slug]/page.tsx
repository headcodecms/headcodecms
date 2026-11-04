import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'
import { entryPath } from '@/headcode/utils'

import {
  getEntrySlug,
  getHeadcodeCollectionEntries,
  getHeadcodeCollectionEntry,
  getMeta,
} from '@/app/(site)/_lib/headcode'
import { firstImage, pageMetadata } from '@/app/(site)/_lib/seo'
import { RenderSections } from '@/app/(site)/_sections'

type Props = { params: Promise<{ slug: string }> }

// Known entries are prerendered; new ones render on first visit (ISR).
// Cache Components needs at least one param, so an empty collection gets '-' (404).
export const generateStaticParams = async () => {
  const entries = await getHeadcodeCollectionEntries(
    await siteVersion(),
    'pages',
  )
  return entries.length
    ? entries.map((entry) => ({ slug: getEntrySlug(entry) }))
    : [{ slug: '-' }]
}

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const page = await getHeadcodeCollectionEntry(
    await siteVersion(),
    'pages',
    (await params).slug,
  )
  if (!page) return {}
  const meta = getMeta(page)
  return pageMetadata({
    title: meta ? `${meta.title} - Headcode` : 'Headcode',
    description: meta?.description,
    path: entryPath(page.entry),
    image: firstImage(page.sections),
  })
}

export default async function Page({ params }: Props) {
  const page = await getHeadcodeCollectionEntry(
    await siteVersion(),
    'pages',
    (await params).slug,
  )
  if (!page) notFound()
  return <RenderSections entry={page.entry} sections={page.sections} />
}
