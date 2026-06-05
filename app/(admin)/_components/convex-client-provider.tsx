'use client'

import { ConvexAuthNextjsProvider } from '@convex-dev/auth/nextjs'
import { ConvexReactClient } from 'convex/react'
import * as React from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const ConvexClientProvider = ({
  children,
}: {
  children: React.ReactNode
}) => (
  <ConvexAuthNextjsProvider client={convex}>
    {children}
  </ConvexAuthNextjsProvider>
)
