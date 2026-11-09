// Seam: authentication. Cloudflare uses WorkOS AuthKit (admin session and
// MCP OAuth); apps/local uses Better Auth.
import { withAuth } from '@workos-inc/authkit-nextjs'
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'

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
