import { UserRole } from '@/components/headcode/types'
import { getRole, getRolesCount } from '@/db'
import { db, provider } from '@/db/db'
import * as schema from '@/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const signInUrl = '/headcode/sign-in'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoLogin: false,
    requireEmailVerification: false,
  },
  plugins: [nextCookies()],
})

export async function requireRole(
  roles: UserRole[],
  skipWhenNoUsers = false,
): Promise<{
  email: string | undefined
  role: UserRole | undefined
  noUsers: boolean
}> {
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    if (skipWhenNoUsers) {
      const rolesCount = await getRolesCount()
      if (rolesCount > 0) {
        redirect(signInUrl)
      } else {
        return { email: undefined, role: undefined, noUsers: true }
      }
    } else {
      redirect(signInUrl)
    }
  }

  const email = session.user.email
  const role = await getRole(email)

  if (!role) {
    throw new Error('UNAUTHORIZED')
  }

  return { email, role: role.role as UserRole, noUsers: false }
}
