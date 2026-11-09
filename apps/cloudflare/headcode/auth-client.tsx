'use client'

// Seam: client-side auth (WorkOS AuthKit here, Better Auth in apps/local).
import { AuthKitProvider, useAuth } from '@workos-inc/authkit-nextjs/components'
import type * as React from 'react'

export const AuthProvider = AuthKitProvider

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
