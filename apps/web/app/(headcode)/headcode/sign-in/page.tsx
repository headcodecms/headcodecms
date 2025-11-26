import { Skeleton } from '@/components/ui/skeleton'
import { noUsers } from '@/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SignInForm } from './form'

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

  if (await noUsers()) {
    redirect('/headcode/users')
  }

  return <SignInForm />
}
