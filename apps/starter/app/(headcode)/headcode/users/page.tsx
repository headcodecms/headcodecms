import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
import { DefaultSkeleton, PageSkeleton } from '@/components/headcode/skeletons'
import { requireRole } from '@/lib/auth'
import { Suspense } from 'react'
import { Users } from './users'

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
      <Users noUsers={noUsers} />
    </Container>
  )
}
