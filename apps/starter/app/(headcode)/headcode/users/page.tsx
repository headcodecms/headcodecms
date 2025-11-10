import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { DefaultSkeleton, PageSkeleton } from '@/components/headcode/skeletons'
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { requireRole } from '@/lib/auth'
import { UserRoundPlusIcon } from 'lucide-react'
import { Suspense } from 'react'
import { DialogAddUser } from './dialogs'
import { UsersTable } from './table'
import { getRoles } from './actions'

export default function Page() {
  return (
    <Container>
      <Suspense fallback={<PageSkeleton />}>
        <UsersPage />
      </Suspense>
    </Container>
  )
}

async function UsersPage() {
  const { role, noUsers } = await requireRole(['admin'], true)

  return (
    <Container>
      <Header role={role} />

      <div className="flex items-end justify-between gap-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Manage users for Headcode CMS.
          </p>
        </div>
        <div>
          <DialogAddUser noUsers={noUsers} />
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        {noUsers ? (
          <Empty className="bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundPlusIcon />
              </EmptyMedia>
              <EmptyTitle>
                Add yourself as an admin user to get started
              </EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <DialogAddUser noUsers={noUsers} />
            </EmptyContent>
          </Empty>
        ) : (
          <Suspense fallback={<DefaultSkeleton />}>
            <Users />
          </Suspense>
        )}
      </div>
    </Container>
  )
}

export async function Users() {
  const data = await getRoles()

  return <UsersTable data={data} />
}
