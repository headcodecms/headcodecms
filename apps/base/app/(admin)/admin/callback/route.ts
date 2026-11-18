import { NextResponse, type NextRequest } from 'next/server'

import { cookie, requestTokens, setTokens } from '@/headcode/admin'
import { requestOrigin } from '@/headcode/utils'

export const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl
  const origin = requestOrigin(req)
  const saved = req.cookies.get(cookie.oauth)?.value
  const { verifier, state, returnTo } = saved
    ? (JSON.parse(saved) as {
        verifier: string
        state: string
        returnTo: string
      })
    : { verifier: '', state: '', returnTo: '/admin' }
  const code = searchParams.get('code')
  if (!code || !verifier || searchParams.get('state') !== state)
    return new NextResponse('Sign-in failed. Please try again.', {
      status: 400,
    })
  const tokens = await requestTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${origin}/admin/callback`,
    code_verifier: verifier,
  })
  if (!tokens)
    return new NextResponse('Sign-in failed. Please try again.', {
      status: 400,
    })
  const res = NextResponse.redirect(new URL(returnTo, origin))
  res.cookies.delete({ name: cookie.oauth, path: '/admin' })
  setTokens(res, tokens)
  return res
}
