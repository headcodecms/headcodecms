import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'

// Sign-in, sessions, JWKS, and the OAuth 2.1 endpoints under /api/auth.
export const { GET, POST } = toNextJsHandler(auth)
