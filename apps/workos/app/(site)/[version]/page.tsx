import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import { getHeadcodeGlobal, getMeta } from '@/app/(site)/_lib/headcode'
import { RenderSections } from '@/app/(site)/_sections'

export const generateMetadata = async (): Promise<Metadata> => {
  const home = await getHeadcodeGlobal(await siteVersion(), 'home')
  const meta = home && getMeta(home)
  return { title: meta?.title, description: meta?.description }
}

export default async function LandingPage() {
  const home = await getHeadcodeGlobal(await siteVersion(), 'home')
  if (!home) notFound()
  return (
    <RenderSections
      entry={home.entry}
      sections={home.sections}
      showHeroActions
    />
  )
}
