import { handleAuth } from '@workos-inc/authkit-nextjs'
import type { NextRequest } from 'next/server'
import { requestOrigin } from '@/headcode/utils'

// Return to the admin on the host that started the sign-in (live or draft).
export const GET = (req: NextRequest) =>
  handleAuth({ returnPathname: '/admin', baseURL: requestOrigin(req) })(req)
