import { withAuth } from '@workos-inc/authkit-nextjs'

// The signed-in admin user for headcode/auth-client.tsx. proxy.ts refreshes
// the AuthKit session on every /admin request.
export const GET = async () => {
  const { user } = await withAuth()
  return Response.json({ user: user ? { email: user.email } : null })
}
