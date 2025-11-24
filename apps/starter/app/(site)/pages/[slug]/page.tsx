import { PageSkeleton } from '@/components/headcode/skeletons'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Suspense } from 'react'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <div>
      <h1>Page</h1>
      <Suspense fallback={<PageSkeleton />}>
        <PageSections slug={slug} />
      </Suspense>
    </div>
  )
}

const PageSections = async ({ slug }: { slug: string }) => {
  'use cache'
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
