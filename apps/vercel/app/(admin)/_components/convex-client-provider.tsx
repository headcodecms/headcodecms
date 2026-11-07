'use client'

import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from '@workos-inc/authkit-nextjs/components'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useCallback } from 'react'

import { revalidateSite } from '../_lib/revalidate'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Every admin write (useMutation calls client.mutation) expires the site cache.
const mutation = convex.mutation.bind(convex)
convex.mutation = async (...args) => {
  const result = await mutation(...args)
  await revalidateSite()
  return result
}

// Passes the WorkOS access token to Convex.
const useWorkOSAuth = () => {
  const { user, loading } = useAuth()
  const userId = user?.id
  const { getAccessToken, refresh } = useAccessToken()
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!userId) return null
      try {
        return (
          (await (forceRefreshToken ? refresh() : getAccessToken())) ?? null
        )
      } catch {
        return null
      }
    },
    [userId, refresh, getAccessToken],
  )
  return { isLoading: loading, isAuthenticated: !!user, fetchAccessToken }
}

export const ConvexClientProvider = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <AuthKitProvider>
    <ConvexProviderWithAuth client={convex} useAuth={useWorkOSAuth}>
      {children}
    </ConvexProviderWithAuth>
  </AuthKitProvider>
)
