import { Container } from '@/components/headcode/container'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { Header } from '@/components/headcode/header'
import { Entry } from './entry'

export default async function EntryPage({
  params,
}: {
  params: Promise<{ ids: string[] }>
}) {
  const { ids } = await params
  const entryId = ids[0]
  const sectionId = ids.length > 1 ? ids[1] : null

  return (
    <Container>
      <Header />

      <Suspense fallback={<Skeleton className="h-16 w-full" />}>
        <Entry entryId={entryId} sectionId={sectionId} />
      </Suspense>
    </Container>
  )
}
