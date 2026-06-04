import Resend from '@auth/core/providers/resend'
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials'
import { convexAuth } from '@convex-dev/auth/server'
import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalMutation } from './_generated/server'

const getAllowedEmails = () =>
  (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

const assertAllowedEmail = (email: string | undefined) => {
  const normalizedEmail = email?.trim().toLowerCase()
  const allowedEmails = getAllowedEmails()

  if (!normalizedEmail || !allowedEmails.includes(normalizedEmail)) {
    throw new ConvexError(
      'Access denied. Ask a Headcode administrator to allow this email.',
    )
  }

  return normalizedEmail
}

const safeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false

  let result = 0
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return result === 0
}

const assertTestLogin = (token: string | undefined) => {
  const expectedToken = process.env.HEADCODE_ADMIN_TEST_TOKEN
  const email = assertAllowedEmail(process.env.HEADCODE_ADMIN_TEST_EMAIL)

  if (
    process.env.HEADCODE_ENABLE_TEST_LOGIN !== 'true' ||
    !token ||
    !expectedToken ||
    !safeCompare(token, expectedToken)
  ) {
    throw new ConvexError('Test login is disabled or invalid.')
  }

  return email
}

export const ensureTestUser = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = assertAllowedEmail(args.email)
    const existingUsers = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .take(1)
    const existingUser = existingUsers[0]

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email,
        emailVerificationTime: Date.now(),
      })
      return existingUser._id
    }

    return await ctx.db.insert('users', {
      email,
      emailVerificationTime: Date.now(),
    })
  },
})

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: process.env.AUTH_RESEND_FROM ?? 'Headcode <onboarding@resend.dev>',
    }),
    ConvexCredentials({
      id: 'test-token',
      authorize: async (credentials, ctx) => {
        const token =
          typeof credentials.token === 'string' ? credentials.token : undefined
        const email = assertTestLogin(token)
        const userId: Id<'users'> = await ctx.runMutation(
          internal.auth.ensureTestUser,
          { email },
        )

        return { userId }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      const email = assertAllowedEmail(profile.email)

      if (existingUserId) {
        await ctx.db.patch(existingUserId, {
          email,
          emailVerificationTime: Date.now(),
        })
        return existingUserId
      }

      return await ctx.db.insert('users', {
        email,
        emailVerificationTime: Date.now(),
      })
    },
    async beforeSessionCreation(ctx, { userId }) {
      const user = await ctx.db.get(userId)
      assertAllowedEmail(user?.email)
    },
  },
})
