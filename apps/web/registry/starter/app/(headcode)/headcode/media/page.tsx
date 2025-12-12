import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { MediaTable } from '@/components/headcode/admin/media-table'
import { PageSkeleton } from '@/components/headcode/skeletons'
import { requireRole } from '@/lib/auth'
import { Suspense } from 'react'
import { Separator } from '@/components/ui/separator'

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <MediaPage />
      </Suspense>
    </Container>
  )
}

async function MediaPage() {
  const { role } = await requireRole(['admin', 'user'])

  return (
    <>
      <Header role={role} />
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Media</h2>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Manage images for Headcode CMS.
        </p>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        <MediaTable />
      </div>
    </>
  )
}
