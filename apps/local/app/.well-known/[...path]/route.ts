import { oauthMetadataResponse } from '@modelcontextprotocol/server'
import { authServerMetadata, mcpUrl } from '@/app/mcp/auth'

// OAuth discovery for MCP clients: protected resource metadata (RFC 9728)
// and the AuthKit authorization server metadata (RFC 8414).
export const GET = async (req: Request) => {
  const metadata = await authServerMetadata()
  // RFC 8414 path insertion: an issuer with a path (Better Auth:
  // /api/auth) is discovered at /.well-known/oauth-authorization-server/api/auth.
  if (
    new URL(req.url).pathname.startsWith(
      '/.well-known/oauth-authorization-server/',
    )
  )
    return Response.json(metadata, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  return (
    oauthMetadataResponse(req, {
      oauthMetadata: metadata,
      resourceServerUrl: mcpUrl(req),
      resourceName: 'Headcode CMS',
    }) ?? new Response('Not found', { status: 404 })
  )
}

export const OPTIONS = GET
