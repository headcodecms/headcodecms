'use client'

// Seam: client-side auth (Better Auth here, WorkOS AuthKit in apps/cloudflare).
import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { createAuthClient } from 'better-auth/react'
import type * as React from 'react'

// The OAuth client plugin forwards the signed `oauth_query` of an MCP
// sign-in, so signing in on /admin/login continues the authorization.
export const authClient = createAuthClient({ plugins: [oauthProviderClient()] })

export const AuthProvider = ({ children }: { children: React.ReactNode }) =>
  children

// The signed-in admin user and sign-out, for the admin header.
export const useAdminUser = () => {
  const { data } = authClient.useSession()
  return {
    email: data?.user.email ?? null,
    signOut: () =>
      void authClient.signOut().then(() => {
        window.location.href = '/'
      }),
  }
}

// Auth gates in the style of convex/react, based on the Better Auth session.
export const AuthLoading = ({ children }: { children: React.ReactNode }) =>
  authClient.useSession().isPending ? children : null
export const Authenticated = ({ children }: { children: React.ReactNode }) => {
  const { isPending, data } = authClient.useSession()
  return !isPending && data ? children : null
}
export const Unauthenticated = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { isPending, data } = authClient.useSession()
  return !isPending && !data ? children : null
}
