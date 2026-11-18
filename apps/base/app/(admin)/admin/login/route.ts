import { createHash, randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { clientId, cookie, issuer, mcpUrl, scope } from '@/headcode/admin'
import { requestOrigin } from '@/headcode/utils'

// Starts the sign-in at apps/auth with PKCE; /admin/callback finishes it.
export const GET = (req: NextRequest) => {
  const verifier = randomBytes(32).toString('base64url')
  const state = randomBytes(16).toString('base64url')
  const returnTo = req.nextUrl.searchParams.get('returnTo')
  const url = new URL(`${issuer}/oauth2/authorize`)
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${requestOrigin(req)}/admin/callback`,
    scope,
    state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    resource: mcpUrl,
  }).toString()
  const res = NextResponse.redirect(url)
  res.cookies.set(
    cookie.oauth,
    JSON.stringify({
      verifier,
      state,
      // Only paths inside the admin, never another site.
      returnTo: returnTo?.startsWith('/admin') ? returnTo : '/admin',
    }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 600,
    },
  )
  return res
}
