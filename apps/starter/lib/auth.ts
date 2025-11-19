import { noUsers } from '@/db'
import type { Role } from '@/lib/headcode/types'
import { db, provider } from '@/db/db'
import * as schema from '@/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const signInUrl = '/headcode/sign-in'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider,
    schema,
  }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies(), admin()],
})

export async function requireRole(
  roles: Role[],
  skipWhenNoUsers = false,
): Promise<{
  email: string | undefined
  role: Role | undefined
  noUsers: boolean
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    if (skipWhenNoUsers) {
      if (!(await noUsers())) {
        redirect(signInUrl)
      } else {
        return { email: undefined, role: undefined, noUsers: true }
      }
    } else {
      redirect(signInUrl)
    }
  }

  const email = session.user.email
  const role = session.user.role as Role

  if (!role || !roles.includes(role)) {
    throw new Error('UNAUTHORIZED')
  }

  return { email, role, noUsers: false }
}
