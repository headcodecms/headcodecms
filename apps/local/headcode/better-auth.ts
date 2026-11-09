// Better Auth (apps/local): email and password sign-in for the admin, and an
// OAuth 2.1 authorization server for MCP clients (CIMD and DCR).
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { jwt } from 'better-auth/plugins'

import * as authSchema from './auth-schema'
import { authDb } from './db'

// The live host is NEXT_PUBLIC_SITE_URL; draft hosts share its protocol and port.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3074'
).replace(/\/$/, '')
const site = new URL(siteUrl)
const draftOrigins = (process.env.NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)
  .map((host) => `${site.protocol}//${host}${site.port ? `:${site.port}` : ''}`)

const mcpUrls = [siteUrl, ...draftOrigins].map((origin) => `${origin}/mcp`)

export const auth = betterAuth({
  baseURL: siteUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(authDb, { provider: 'sqlite', schema: authSchema }),
  trustedOrigins: [siteUrl, ...draftOrigins],
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // "editor" may write; everyone else reads (see headcode/authorization.ts).
      headcodeRole: { type: 'string', defaultValue: 'viewer', input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // The first account of an install becomes the editor.
        before: async (user, ctx) => {
          const users = await ctx?.context.adapter.count({ model: 'user' })
          return { data: { ...user, headcodeRole: users ? 'viewer' : 'editor' } }
        },
      },
    },
  },
  plugins: [
    jwt(),
    mcp({
      loginPage: '/admin/login',
      consentPage: '/admin/consent',
      // Live and draft hosts are separate resources (one /mcp URL each);
      // new clients are linked to all of them.
      resource: mcpUrls[0],
      resources: mcpUrls.slice(1),
      clientRegistrationDefaultResources: mcpUrls,
      clientRegistrationAllowedResources: mcpUrls,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: 'infer',
      customAccessTokenClaims: async ({ user }) => ({
        headcode_role: (user as { headcodeRole?: string } | undefined)
          ?.headcodeRole,
      }),
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
    nextCookies(),
  ],
})
