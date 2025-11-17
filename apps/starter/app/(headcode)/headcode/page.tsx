import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { DefaultSkeleton, PageSkeleton } from '@/components/headcode/skeletons'
import { Separator } from '@/components/ui/separator'
import { headcodeConfig } from '@/headcode.config'
import { requireRole } from '@/lib/auth'
import { getEntries } from '@/lib/headcode/admin'
import { Suspense } from 'react'
import { AlertClone, AlertNewInstallation } from './alerts'
import { DialogAddEntry } from './dialogs'
import { EntriesTable } from './table'
import { getEntriesCount } from '@/db'

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
  const { entryTypes, entries, emptyEntries } = await getEntries()
  const dynamicEntries = entryTypes.filter((entryType) => entryType.dynamic)

  const version = headcodeConfig.version
  // @ts-expect-error - clone is optional
  const clone = headcodeConfig.clone

  let newInstallation = false
  if (emptyEntries && !clone) {
    newInstallation = (await getEntriesCount()) === 0
  }

  return (
    <>
      {newInstallation && <AlertNewInstallation />}
      {emptyEntries && clone && <AlertClone clone={clone} />}

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
