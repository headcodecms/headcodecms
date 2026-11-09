// Seam: authentication. apps/local uses Better Auth (headcode/better-auth.ts):
// email/password sessions for the admin, OAuth 2.1 tokens for MCP clients.
// apps/cloudflare uses WorkOS AuthKit with the same functions.
import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { getSessionCookie } from 'better-auth/cookies'
import { createLocalJWKSet, decodeJwt, jwtVerify } from 'jose'
import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import type { Identity } from './authorization'
import { auth, siteUrl } from './better-auth'

// The signed-in admin user, from the Better Auth session cookie.
export const getAdminIdentity = async (): Promise<Identity | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  const user = session.user as typeof session.user & { headcodeRole?: string }
  return { subject: user.id, headcode_role: user.headcodeRole }
}

// MCP OAuth: Better Auth issues JWT access tokens bound to the /mcp URL of
// the request host (RFC 8707 resource).
export const verifyMcpAccessToken = async (token: string, resource: URL) => {
  const keys = createLocalJWKSet(
    (await auth.api.getJwks()) as Parameters<typeof createLocalJWKSet>[0],
  )
  const { payload } = await jwtVerify(token, keys, {
    issuer: [siteUrl, `${siteUrl}/api/auth`],
    audience: resource.href,
  })
  return payload
}

export const authServerMetadata = async () =>
  (
    await oauthProviderAuthServerMetadata(auth)(
      new Request(`${siteUrl}/.well-known/oauth-authorization-server/api/auth`),
    )
  ).json()

// proxy.ts: /admin needs a session; the sign-in and consent pages are open.
export const protectAdmin = async (req: NextRequest, origin: string) => {
  const { pathname, search } = req.nextUrl
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/consent') ||
    getSessionCookie(req)
  )
    return NextResponse.next()
  const login = new URL('/admin/login', origin)
  login.searchParams.set('next', pathname + search)
  return NextResponse.redirect(login, 307)
}

// The identity in an MCP OAuth access token that app/mcp/auth.ts verified.
export const getMcpIdentity = (token: string): Identity => {
  const claims = decodeJwt(token)
  return {
    subject: String(claims.sub ?? ''),
    headcode_role: claims.headcode_role,
  }
}
