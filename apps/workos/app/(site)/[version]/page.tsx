import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import { getHeadcodeGlobal, getMeta } from '@/app/(site)/_lib/headcode'
import {
  firstImage,
  JsonLd,
  pageMetadata,
  siteUrl,
} from '@/app/(site)/_lib/seo'
import { RenderSections } from '@/app/(site)/_sections'

export const generateMetadata = async (): Promise<Metadata> => {
  const home = await getHeadcodeGlobal(await siteVersion(), 'home')
  const meta = home && getMeta(home)
  return pageMetadata({
    ...meta,
    path: '/',
    image: home && firstImage(home.sections),
  })
}

export default async function LandingPage() {
  const home = await getHeadcodeGlobal(await siteVersion(), 'home')
  if (!home) notFound()
  const meta = getMeta(home)
  return (
    <>
      <JsonLd
        data={{
          '@type': 'WebSite',
          name: meta?.title,
          description: meta?.description,
          url: siteUrl,
        }}
      />
      <RenderSections
        entry={home.entry}
        sections={home.sections}
        showHeroActions
      />
    </>
  )
}
