// Seam: authentication. Cloudflare uses WorkOS AuthKit (admin session and
// MCP OAuth); apps/local uses Better Auth.
import {
  authkit,
  handleAuthkitHeaders,
  withAuth,
} from '@workos-inc/authkit-nextjs'
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

import type { Identity } from './authorization'

const issuer = () => `https://${process.env.WORKOS_AUTHKIT_DOMAIN}`
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

// The signed-in admin user, from the AuthKit session cookie.
export const getAdminIdentity = async (): Promise<Identity | null> => {
  const { user, accessToken } = await withAuth()
  if (!user || !accessToken) return null
  const claims = decodeJwt(accessToken)
  return { subject: user.id, headcode_role: claims.headcode_role }
}

// MCP OAuth: AuthKit is the authorization server; the audience is the /mcp
// URL of the request host.
export const verifyMcpAccessToken = async (token: string, resource: URL) => {
  jwks ??= createRemoteJWKSet(new URL(`${issuer()}/oauth2/jwks`))
  const { payload } = await jwtVerify(token, jwks, {
    issuer: issuer(),
    audience: resource.href,
  })
  return payload
}

let metadata: Promise<unknown> | undefined
export const authServerMetadata = () =>
  (metadata ??= fetch(
    `${issuer()}/.well-known/oauth-authorization-server`,
  ).then((res) => res.json()))

// proxy.ts: unauthenticated /admin requests go to AuthKit, with the callback
// on the request host (live and draft each get their own session cookie).
export const protectAdmin = async (req: NextRequest, origin: string) => {
  const { session, headers, authorizationUrl } = await authkit(req, {
    redirectUri: `${origin}/callback`,
  })
  if (!session.user && authorizationUrl)
    return handleAuthkitHeaders(req, headers, { redirect: authorizationUrl })
  return handleAuthkitHeaders(req, headers)
}

// The identity in an MCP OAuth access token that app/mcp/auth.ts verified.
export const getMcpIdentity = (token: string): Identity => {
  const claims = decodeJwt(token)
  return {
    subject: String(claims.sub ?? ''),
    headcode_role: claims.headcode_role,
  }
}
