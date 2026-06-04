import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderSections } from './_sections'
import { getHeadcodeGlobal, getMeta } from './_lib/headcode'

export const generateMetadata = async (): Promise<Metadata> => {
  const home = await getHeadcodeGlobal('home')
  const meta = home ? getMeta(home) : null

  return {
    title: meta?.title,
    description: meta?.description,
  }
}

export default async function LandingPage() {
  const home = await getHeadcodeGlobal('home')
  if (!home) notFound()

  return (
    <RenderSections
      entry={home.entry}
      sections={home.sections}
      showHeroActions
    />
  )
}
