import { PageSkeleton } from '@/components/headcode/skeletons'
import { getEntries } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import Link from 'next/link'
import { Suspense } from 'react'

export default function Pages() {
  return (
    <div>
      <h1>Pages</h1>
      <Suspense fallback={<PageSkeleton />}>
        <PagesOverview />
      </Suspense>
    </div>
  )
}

const PagesOverview = async () => {
  'use cache'
  cacheTag('/headcode/entries')

  const pages = await getEntries('pages')
  return (
    <div>
      {pages?.map((page) => (
        <div key={page.id}>
          <Link href={`/pages/${page.key}`}>{page.key}</Link>
        </div>
      ))}
    </div>
  )
}
