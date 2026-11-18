import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'
import { entryPath } from '@/headcode/utils'

import { getHeadcodeCollectionEntry, getMeta } from '@/app/(site)/_lib/headcode'
import { firstImage, pageMetadata } from '@/app/(site)/_lib/seo'
import { RenderSections } from '@/app/(site)/_sections'

type Props = { params: Promise<{ slug: string }> }

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const page = await getHeadcodeCollectionEntry(
    await siteVersion(),
    'pages',
    (await params).slug,
  )
  // Before the body streams, so a missing page answers with status 404.
  if (!page) notFound()
  const meta = getMeta(page)
  return pageMetadata({
    title: meta ? `${meta.title} - Headcode` : 'Headcode',
    description: meta?.description,
    path: entryPath(page.entry),
    image: firstImage(page.sections),
  })
}

// Not streamed, so a missing page answers with status 404.
export default async function CollectionPage({ params }: Props) {
  const page = await getHeadcodeCollectionEntry(
    await siteVersion(),
    'pages',
    (await params).slug,
  )
  if (!page) notFound()
  return <RenderSections entry={page.entry} sections={page.sections} />
}
