import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { DefaultSkeleton, PageSkeleton } from '@/components/headcode/skeletons'
import { Separator } from '@/components/ui/separator'
import { headcodeConfig } from '@/headcode.config'
import { requireRole } from '@/lib/auth'
import { Suspense } from 'react'
import { EntriesTable } from './table'
import { getEntries } from '@/lib/headcode/entries'
import { AlertClone } from './alerts'
import { DialogAddEntry } from './dialogs'

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <EntriesPage />
      </Suspense>
    </Container>
  )
}

async function EntriesPage() {
  const { role } = await requireRole(['user', 'admin'])

  return (
    <Container>
      <Header role={role} />

      <Suspense fallback={<DefaultSkeleton />}>
        <Entries />
      </Suspense>
    </Container>
  )
}

export async function Entries() {
  const { entryTypes, entries, emptyEntries } = await getEntries()
  const dynamicEntries = entryTypes.filter((entryType) => entryType.dynamic)

  const version = headcodeConfig.version
  const clone = headcodeConfig.clone

  console.log('entries', entryTypes, entries, emptyEntries)

  return (
    <>
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
        <div>
          {dynamicEntries.length > 0 && (
            <DialogAddEntry version={version} dynamicEntries={dynamicEntries} />
          )}
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        {emptyEntries && clone && <AlertClone clone={clone} />}
        <EntriesTable
          version={version}
          data={entries}
          entryTypes={entryTypes}
        />
      </div>
    </>
  )
}
