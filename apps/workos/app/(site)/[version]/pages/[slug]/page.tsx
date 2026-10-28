import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import {
  getEntrySlug,
  getHeadcodeCollectionEntries,
  getHeadcodeCollectionEntry,
  getMeta,
} from '@/app/(site)/_lib/headcode'
import { RenderSections } from '@/app/(site)/_sections'

type Props = { params: Promise<{ slug: string }> }

// Known entries are prerendered; new ones render on first visit (ISR).
export const generateStaticParams = async () =>
  (await getHeadcodeCollectionEntries(await siteVersion(), 'pages')).map(
    (entry) => ({ slug: getEntrySlug(entry) }),
  )

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
  return {
    title: meta ? `${meta.title} - Headcode` : 'Headcode',
    description: meta?.description,
  }
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
