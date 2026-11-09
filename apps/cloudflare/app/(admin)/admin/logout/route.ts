import { signOut } from '@workos-inc/authkit-nextjs'

import { requestOrigin } from '@/headcode/utils'

// Ends the AuthKit session and returns to the site of this host.
export const GET = async (req: Request) =>
  signOut({ returnTo: `${requestOrigin(req)}/` })
