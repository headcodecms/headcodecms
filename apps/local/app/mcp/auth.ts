import {
  getOAuthProtectedResourceMetadataUrl,
  OAuthError,
  OAuthErrorCode,
  type OAuthMetadata,
  requireBearerAuth,
} from '@modelcontextprotocol/server'
import {
  authServerMetadata as fetchAuthServerMetadata,
  verifyMcpAccessToken,
} from '@/headcode/auth'
import { isAllowedMcpToken } from '@/headcode/authorization'
import { requestOrigin } from '@/headcode/utils'

// MCP clients sign in with OAuth (the auth seam's authorization server) or
// send a shared bearer token from ALLOWED_MCP_TOKENS.

export const authServerMetadata = () =>
  fetchAuthServerMetadata() as Promise<OAuthMetadata>

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
        const payload = await verifyMcpAccessToken(token, resource).catch(
          () => {
            throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid token')
          },
        )
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
