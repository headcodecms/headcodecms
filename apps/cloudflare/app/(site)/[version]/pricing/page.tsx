import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import { getHeadcodeGlobal, getMeta } from '@/app/(site)/_lib/headcode'
import { firstImage, pageMetadata } from '@/app/(site)/_lib/seo'
import { RenderSections } from '@/app/(site)/_sections'

export const generateMetadata = async (): Promise<Metadata> => {
  const pricing = await getHeadcodeGlobal(await siteVersion(), 'pricing')
  const meta = pricing && getMeta(pricing)
  return pageMetadata({
    title: meta ? `${meta.title} - Headcode` : 'Pricing - Headcode',
    description: meta?.description,
    path: '/pricing',
    image: pricing && firstImage(pricing.sections),
  })
}

export default async function PricingPage() {
  const pricing = await getHeadcodeGlobal(await siteVersion(), 'pricing')
  if (!pricing) notFound()
  return <RenderSections entry={pricing.entry} sections={pricing.sections} />
}
