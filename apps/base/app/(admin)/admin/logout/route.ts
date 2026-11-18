import { NextResponse, type NextRequest } from 'next/server'

import { clearTokens } from '@/headcode/admin'
import { requestOrigin } from '@/headcode/utils'

// Signs out of this site; the session at apps/auth stays.
export const POST = (req: NextRequest) => {
  const res = NextResponse.redirect(new URL('/', requestOrigin(req)), 303)
  clearTokens(res)
  return res
}
