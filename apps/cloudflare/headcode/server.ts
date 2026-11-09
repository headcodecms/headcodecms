import { decodeJwt } from 'jose'

import type { FunctionArgs, FunctionReturnType, ServiceRef } from './api'
import { type Auth, requireHeadcodeUser } from './authorization'
import { getDb } from './db'
import { callService } from './services'

export { api } from './api'
export { HeadcodeError } from './authorization'

// Server-side calls in the style of convex/nextjs. `token` is an MCP OAuth
// access token that app/mcp/auth.ts has already verified.
type Options = { token?: string; auth?: Auth }

const toAuth = ({ token, auth }: Options = {}): Auth => {
  if (auth) return auth
  if (!token) return {}
  const claims = decodeJwt(token)
  return {
    identity: {
      subject: String(claims.sub ?? ''),
      headcode_role: claims.headcode_role,
    },
  }
}

const call = async <R extends ServiceRef>(
  ref: R,
  args: FunctionArgs<R>,
  options?: Options,
) =>
  (
    await callService(
      getDb(),
      ref.name,
      args as Record<string, unknown>,
      toAuth(options),
    )
  ).result as FunctionReturnType<R>

export const fetchQuery = call
export const fetchMutation = call

// Fails unless the caller may write (editor or shared MCP token).
export const requireWrite = (args: { mcpToken?: string }, options?: Options) =>
  requireHeadcodeUser({ ...toAuth(options), mcpToken: args.mcpToken }, true)
