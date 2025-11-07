import { Role } from '@/components/headcode/types'
import { db, provider } from '@/db/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const signInUrl = '/headcode/sign-in'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
})

export async function requireRole(
  roles: Role[],
  skipWhenNoUsers = false,
): Promise<{ role: Role; noUsers: boolean }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    if (skipWhenNoUsers) {
      // check if users table is empty
      if (/* users table count > 0 */ true) {
        redirect(signInUrl)
      }
    } else {
      redirect(signInUrl)
    }
  }
  // get role of user
  // check if role is in roles, otherwise redirect to unauthorized
  return { role: 'admin', noUsers: false }
}
