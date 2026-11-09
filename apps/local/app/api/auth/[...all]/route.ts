import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/headcode/better-auth'

// Better Auth: sign-in, sessions, JWKS, and the OAuth 2.1 endpoints for MCP.
export const { GET, POST } = toNextJsHandler(auth)
