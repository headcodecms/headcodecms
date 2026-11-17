// Better Auth: email and password sign-in, and the OAuth 2.1 authorization
// server for MCP clients (CIMD and DCR). The backend verifies the JWT access
// tokens against /api/auth/jwks; permissions live in the backend, not here.
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { jwt } from 'better-auth/plugins'
import { attachDatabasePool } from '@vercel/functions'
import { Pool } from 'pg'

export const authUrl = (
  process.env.AUTH_URL ?? 'http://localhost:3081'
).replace(/\/$/, '')

// One MCP URL per project, for example http://localhost:3080/p/demo/mcp.
const resources = (
  process.env.MCP_RESOURCES ?? 'http://localhost:3080/p/demo/mcp'
)
  .split(',')
  .map((resource) => resource.trim())
  .filter(Boolean)

// Local default: the backend's embedded Postgres (apps/backend).
function pool() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:headcode@localhost:54329/headcode',
    max: 3,
    // A suspended database (Neon) needs a moment to wake up.
    connectionTimeoutMillis: 10_000,
    // Idle connections keep the database awake: the server closes them after
    // 60 s, and Vercel Fluid compute closes them before it suspends.
    options: '-c idle_session_timeout=60s',
  })
  attachDatabasePool(pool)
  return pool
}

export const auth = betterAuth({
  baseURL: authUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool(),
  // Access tokens come only from /oauth2/token, never from the JWT plugin.
  disabledPaths: ['/token'],
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP === 'true',
  },
  // Serverless instances share no memory, so count requests in the database.
  rateLimit: { storage: 'database' },
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    mcp({
      loginPage: '/sign-in',
      consentPage: '/consent',
      resource: resources[0],
      resources: resources.slice(1),
      clientRegistrationDefaultResources: resources,
      clientRegistrationAllowedResources: resources,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: 'infer',
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
    nextCookies(),
  ],
})
