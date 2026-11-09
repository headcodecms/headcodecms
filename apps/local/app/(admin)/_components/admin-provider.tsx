'use client'

import { AuthProvider } from '@/headcode/auth-client'

// Admin data comes from headcode/client.tsx; this only provides the session.
export const AdminProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)
