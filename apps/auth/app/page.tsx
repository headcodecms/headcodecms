import { headers } from 'next/headers'
import Link from 'next/link'

import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  return (
    <>
      <h1>Headcode Auth</h1>
      {session ? (
        <p>Signed in as {session.user.email}.</p>
      ) : (
        <p>
          <Link href="/sign-in">Sign in</Link>
        </p>
      )}
    </>
  )
}
