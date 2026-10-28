import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

// WorkOS "Initiate login URI": starts the hosted AuthKit sign-in.
export const GET = async () => redirect(await getSignInUrl())
