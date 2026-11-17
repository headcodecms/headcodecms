import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'

import { auth } from '@/lib/auth'

// RFC 8414 path insertion: the issuer is /api/auth, so MCP clients look for
// its metadata at /.well-known/oauth-authorization-server/api/auth.
export const GET = oauthProviderAuthServerMetadata(auth, {
  headers: { 'Access-Control-Allow-Origin': '*' },
})
