import { noUsers } from '@/db'
import type { Role } from '@/lib/headcode/types'
import { UnauthorizedError } from '@/lib/headcode/errors'
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

/**
 * Requires a user to have one of the specified roles.
 * Throws UnauthorizedError or redirects if the user doesn't have the required role.
 *
 * @param roles - Array of allowed roles
 * @param skipWhenNoUsers - If true, allows access when no users exist in the database
 * @returns User email and role (role is always defined unless skipWhenNoUsers is true and noUsers is true)
 */
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
  const role = session.user.role

  // Type guard: ensure role is a valid Role type
  if (!role || typeof role !== 'string' || !['user', 'admin'].includes(role)) {
    throw new UnauthorizedError()
  }

  const validRole = role as Role

  if (!roles.includes(validRole)) {
    throw new UnauthorizedError()
  }

  return { email, role: validRole, noUsers: false }
}
