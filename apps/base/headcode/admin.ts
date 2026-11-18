// Server side of the admin: sign-in at apps/auth (OAuth 2.1 with PKCE, this
// site as a first-party client) and calls to the backend's MCP tools with the
// signed-in user's token. The backend decides what the user may do.
import type { NextResponse } from 'next/server'

const trim = (url: string) => url.replace(/\/$/, '')

export const backendUrl = trim(
  process.env.HEADCODE_URL ?? 'http://localhost:3080',
)
export const project = process.env.HEADCODE_PROJECT ?? 'demo'
export const mcpUrl = `${backendUrl}/p/${project}/mcp`
export const issuer = `${trim(process.env.AUTH_URL ?? 'http://localhost:3081')}/api/auth`
// `pnpm client` in apps/auth prints it.
export const clientId = process.env.HEADCODE_CLIENT_ID ?? ''
export const scope = 'openid profile email offline_access'

// The tokens live in httpOnly cookies that only /admin requests carry.
export const cookie = {
  access: 'hc_at',
  refresh: 'hc_rt',
  oauth: 'hc_oauth',
} as const

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/admin',
} as const

export type Tokens = {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

export const requestTokens = async (params: Record<string, string>) => {
  const res = await fetch(`${issuer}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      resource: mcpUrl,
      ...params,
    }),
    cache: 'no-store',
  })
  return res.ok ? ((await res.json()) as Tokens) : null
}

export const setTokens = (res: NextResponse, tokens: Tokens) => {
  res.cookies.set(cookie.access, tokens.access_token, {
    ...cookieOptions,
    maxAge: tokens.expires_in ?? 3600,
  })
  if (tokens.refresh_token)
    res.cookies.set(cookie.refresh, tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 30 * 24 * 3600,
    })
}

export const clearTokens = (res: NextResponse) => {
  for (const name of Object.values(cookie))
    res.cookies.set(name, '', { ...cookieOptions, maxAge: 0 })
}

// Seconds until the JWT access token expires (0 if it cannot be read).
export const expiresIn = (token: string) => {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    )
    return payload.exp - Date.now() / 1000
  } catch {
    return 0
  }
}

export class ToolError extends Error {}

// One MCP tool call (the backend is stateless, so no session is needed).
export const callTool = async (
  token: string,
  name: string,
  args: object = {},
) => {
  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    cache: 'no-store',
  })
  if (res.status === 401) throw new ToolError('Your sign-in has expired.')
  const body = await res.json()
  if (body.error) throw new ToolError(body.error.message)
  if (body.result?.isError)
    throw new ToolError(JSON.stringify(body.result.content))
  return body.result.structuredContent as unknown
}
