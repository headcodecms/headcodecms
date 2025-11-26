import { Container } from '@/components/headcode/themes/vienna/container'
import { Features } from '@/components/headcode/themes/vienna/features'
import { Hero } from '@/components/headcode/themes/vienna/hero'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text } from '@/components/headcode/themes/vienna/text'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { Fragment } from 'react/jsx-runtime'

export default function Docs({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <DocsSection params={params} />
}

const DocsSection = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params

  return <div>Docs Section {slug}</div>
}
