'use client'

// Seam: client-side auth (WorkOS AuthKit here, Better Auth in apps/local).
import { AuthKitProvider, useAuth } from '@workos-inc/authkit-nextjs/components'
import type * as React from 'react'

export const AuthProvider = AuthKitProvider

// The signed-in admin user and sign-out, for the admin header.
export const useAdminUser = () => {
  const { user, signOut } = useAuth()
  return {
    email: user?.email ?? null,
    signOut: () => void signOut({ returnTo: `${location.origin}/` }),
  }
}

// Auth gates in the style of convex/react, based on the AuthKit session.
export const AuthLoading = ({ children }: { children: React.ReactNode }) =>
  useAuth().loading ? children : null
export const Authenticated = ({ children }: { children: React.ReactNode }) => {
  const { loading, user } = useAuth()
  return !loading && user ? children : null
}
export const Unauthenticated = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { loading, user } = useAuth()
  return !loading && !user ? children : null
}
