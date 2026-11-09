'use client'

// Seam: client-side auth (WorkOS AuthKit here, Better Auth in apps/local).
// The admin reads the session from /admin/session and signs out through
// /admin/logout, so no AuthKit code runs in the browser (its client
// components pull server code into Vite's dependency pre-bundle).
import * as React from 'react'

type AdminSession = { email: string | null; loading: boolean }
const SessionContext = React.createContext<AdminSession>({
  email: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<AdminSession>({
    email: null,
    loading: true,
  })
  React.useEffect(() => {
    fetch('/admin/session')
      .then(async (res) =>
        res.ok
          ? ((await res.json()) as { user: { email: string } | null })
          : { user: null },
      )
      .then(({ user }) =>
        setSession({ email: user?.email ?? null, loading: false }),
      )
      .catch(() => setSession({ email: null, loading: false }))
  }, [])
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

// The signed-in admin user and sign-out, for the admin header.
export const useAdminUser = () => {
  const { email } = React.useContext(SessionContext)
  return {
    email,
    signOut: () =>
      location.assign(new URL('/admin/logout', location.href).href),
  }
}

// Auth gates in the style of convex/react, based on the admin session.
export const AuthLoading = ({ children }: { children: React.ReactNode }) =>
  React.useContext(SessionContext).loading ? children : null
export const Authenticated = ({ children }: { children: React.ReactNode }) => {
  const { loading, email } = React.useContext(SessionContext)
  return !loading && email ? children : null
}
export const Unauthenticated = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const { loading, email } = React.useContext(SessionContext)
  return !loading && !email ? children : null
}
