import { PageSkeleton } from '@/components/headcode/skeletons'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HomeSections />
      </Suspense>
    </div>
  )
}

const HomeSections = async () => {
  'use cache'
  cacheTag('/headcode/entries/global/homepage')

  const sections = await getSections('global', 'homepage')
  return (
    <div>
      {sections?.map((section) => (
        <div key={section.id}>
          <h2>{section.name}</h2>
        </div>
      ))}
    </div>
  )
}
