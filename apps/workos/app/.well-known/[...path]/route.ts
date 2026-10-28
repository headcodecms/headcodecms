import { oauthMetadataResponse } from '@modelcontextprotocol/server'
import { authServerMetadata, mcpUrl } from '@/app/mcp/auth'

// OAuth discovery for MCP clients: protected resource metadata (RFC 9728)
// and the AuthKit authorization server metadata (RFC 8414).
export const GET = async (req: Request) =>
  oauthMetadataResponse(req, {
    oauthMetadata: await authServerMetadata(),
    resourceServerUrl: mcpUrl(req),
    resourceName: 'Headcode CMS',
  }) ?? new Response('Not found', { status: 404 })

export const OPTIONS = GET
