'use server'

import { withAuth } from '@workos-inc/authkit-nextjs'
import { updateTag } from 'next/cache'

import { headcodeTag } from '@/app/(site)/_lib/headcode'

// Admin writes go straight to Convex; this expires the cached site afterwards.
export const revalidateSite = async () => {
  await withAuth({ ensureSignedIn: true })
  updateTag(headcodeTag)
}
