import {
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  type OAuthMetadata,
  requireBearerAuth,
} from '@modelcontextprotocol/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { isAllowedMcpToken } from '@/convex/authorization'
import { requestOrigin } from '@/headcode/utils'

// MCP clients sign in with OAuth (WorkOS AuthKit is the authorization server)
// or send a shared bearer token from ALLOWED_MCP_TOKENS.

const issuer = `https://${process.env.WORKOS_AUTHKIT_DOMAIN}`
const jwks = createRemoteJWKSet(new URL(`${issuer}/oauth2/jwks`))

let metadata: Promise<OAuthMetadata> | undefined
export const authServerMetadata = () =>
  (metadata ??= fetch(`${issuer}/.well-known/oauth-authorization-server`).then(
    (res) => res.json(),
  ))

// The resource URL follows the request host, so live and draft are separate resources.
export const mcpUrl = (req: Request) => new URL('/mcp', requestOrigin(req))

export const authenticate = (req: Request) => {
  const resource = mcpUrl(req)
  return requireBearerAuth({
    expectedResource: resource,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resource),
    verifier: {
      verifyAccessToken: async (token) => {
        if (isAllowedMcpToken(token))
          return {
            token,
            clientId: 'headcode-shared-token',
            scopes: [],
            expiresAt: Math.floor(Date.now() / 1000) + 60,
            resource,
            extra: { shared: true },
          }
        const { payload } = await jwtVerify(token, jwks, {
          issuer,
          audience: resource.href,
        }).catch(() => {
          throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid token')
        })
        return {
          token,
          clientId: String(payload.client_id ?? payload.azp ?? ''),
          scopes: String(payload.scope ?? '')
            .split(' ')
            .filter(Boolean),
          expiresAt: payload.exp,
          resource,
        }
      },
    },
  })(req)
}
