import { Suspense } from 'react'
import { SignInForm } from './form'
import { Skeleton } from '@/components/ui/skeleton'
import { getRolesCount } from '@/db'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Skeleton className="h-36 w-full" />}>
          <SignIn />
        </Suspense>
      </div>
    </div>
  )
}

async function SignIn() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session) {
    redirect('/headcode')
  }

  const rolesCount = await getRolesCount()
  if (rolesCount === 0) {
    redirect('/headcode/users')
  }

  return <SignInForm />
}
