import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@/lib/auth'

import { ResendVerification } from './resend-verification'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  return (
    <>
      <h1>Headcode Auth</h1>
      {session ? (
        <>
          <p>Signed in as {session.user.email}.</p>
          {/* Project invitations need a confirmed address. */}
          {session.user.emailVerified ? null : (
            <>
              <p>
                Please confirm your email address with the link we sent to{' '}
                {session.user.email}. Project invitations work once it is
                confirmed.
              </p>
              <ResendVerification email={session.user.email} />
            </>
          )}
        </>
      ) : (
        <p>
          <Link href="/sign-in">Sign in</Link>
        </p>
      )}
    </>
  )
}
