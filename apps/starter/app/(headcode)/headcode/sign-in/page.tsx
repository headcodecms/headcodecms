import { Suspense } from 'react'
import { SignInForm } from './form'
import { Skeleton } from '@/components/ui/skeleton'

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
  // check if user is logged in, if yes redirect to dashboard
  // check if users table is empty, if yes redirect to users page

  return <SignInForm />
}
