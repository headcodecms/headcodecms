import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { DefaultSkeleton, PageSkeleton } from '@/components/headcode/skeletons'
import { Separator } from '@/components/ui/separator'
import { getEntriesCount } from '@/db'
import { requireRole } from '@/lib/auth'
import { getEntries } from '@/lib/headcode/admin'
import { getVersion, getClone, hasClone } from '@/lib/headcode/config'
import { Suspense } from 'react'
import { AlertClone, AlertNewInstallation } from './alerts'
import { DialogAddEntry } from './dialogs'
import { EntriesTable } from './table'
import { cacheTag } from 'next/cache'

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
    <>
      <Header role={role} />

      <Suspense fallback={<DefaultSkeleton />}>
        <Entries />
      </Suspense>
    </>
  )
}

export async function Entries() {
  'use cache'
  cacheTag('/headcode/entries')

  const { entryTypes, entries, emptyEntries } = await getEntries()
  const dynamicEntries = entryTypes.filter((entryType) => entryType.dynamic)

  const version = getVersion()
  const clone = getClone()

  let newInstallation = false
  if (emptyEntries && !hasClone()) {
    newInstallation = (await getEntriesCount()) === 0
  }

  return (
    <>
      {newInstallation && <AlertNewInstallation />}
      {emptyEntries && clone ? <AlertClone clone={clone} /> : null}

      <div className="flex items-end justify-between gap-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Content Entries</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Manage dynamic (e.g., blog posts) and static content entries.
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
        <EntriesTable
          version={version}
          data={entries}
          entryTypes={entryTypes}
        />
      </div>
    </>
  )
}
