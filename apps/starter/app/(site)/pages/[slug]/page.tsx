import { PageSkeleton } from '@/components/headcode/skeletons'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Suspense } from 'react'

export default function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return (
    <div>
      <h1>Page</h1>
      <Suspense fallback={<PageSkeleton />}>
        <PageSections params={params} />
      </Suspense>
    </div>
  )
}

const PageSections = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  'use cache'

  const { slug } = await params
  cacheTag(`/headcode/entries/pages/${slug}`)

  const sections = await getSections('pages', slug)

  return (
    <div>
      {sections?.map((item) => (
        <div key={item.id}>
          <h2>{item.name}</h2>
        </div>
      ))}
    </div>
  )
}
