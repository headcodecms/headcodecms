import { Container } from '@/components/container'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { Header } from '../header'
import { DialogAddUser } from './dialog-add-user'
import { Users } from './users'
import { requireRole } from '@/lib/auth'

// if no users show empty state with add admin user
// auth: role is admin or no users in DB
export default async function UsersPage() {
  const { role, noUsers } = await requireRole(['admin'])

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
          <DialogAddUser />
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        <Suspense fallback={<Skeleton className="h-36 w-full" />}>
          <Users />
        </Suspense>
      </div>
    </Container>
  )
}
