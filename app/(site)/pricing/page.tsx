import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { RenderSections } from '../_sections'
import { getHeadcodeGlobal, getMeta } from '../_lib/headcode'

export const generateMetadata = async (): Promise<Metadata> => {
  const pricing = await getHeadcodeGlobal('pricing')
  const meta = pricing ? getMeta(pricing) : null

  return {
    title: meta ? `${meta.title} - Headcode` : 'Pricing - Headcode',
    description: meta?.description,
  }
}

export default async function PricingPage() {
  const pricing = await getHeadcodeGlobal('pricing')
  if (!pricing) notFound()

  return <RenderSections entry={pricing.entry} sections={pricing.sections} />
}
