import { oauthProviderClient } from '@better-auth/oauth-provider/client'
import { createAuthClient } from 'better-auth/react'

// The OAuth client plugin sends the signed `oauth_query` on sign-in and
// consent, and follows the redirect back to the MCP client.
export const authClient = createAuthClient({
  plugins: [oauthProviderClient()],
})
