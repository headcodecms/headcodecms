import { Container } from '@/components/container'
import { Header } from './header'
import { Suspense } from 'react'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Entries } from './entries'
import { requireRole } from '@/lib/auth'

export default async function DashboardPage() {
  const { role } = await requireRole(['editor', 'admin'])

  return (
    <Container>
      <Header role={role} />

      <div className="flex items-end justify-between gap-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Content Entries</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            An entry is identified by namespace and key, and has multiple
            content sections. Entries within a namespace can be either static
            (e.g., namespace=global, key=footer) or dynamic [dynamic icon]
            (e.g., namespace=blog, key=post-1). You cannot mix static and
            dynamic entries within the same namespace. Click on an entry to edit
            its sections.
          </p>
        </div>
        <div>Add Entry</div>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        <Suspense fallback={<Skeleton className="h-36 w-full" />}>
          <Entries />
        </Suspense>
      </div>
    </Container>
  )
}
