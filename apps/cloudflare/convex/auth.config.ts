import type { AuthConfig } from 'convex/server'

const clientId = process.env.WORKOS_CLIENT_ID

// WorkOS AuthKit access tokens. Admins are the users of the WorkOS environment.
export default {
  providers: [
    // Admin UI sessions
    {
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
    // MCP OAuth tokens (audience is checked in app/mcp/auth.ts)
    {
      type: 'customJwt',
      issuer: `https://${process.env.WORKOS_AUTHKIT_DOMAIN}`,
      algorithm: 'RS256',
      jwks: `https://${process.env.WORKOS_AUTHKIT_DOMAIN}/oauth2/jwks`,
    },
  ],
} satisfies AuthConfig
