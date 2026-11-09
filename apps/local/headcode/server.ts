import type { FunctionArgs, FunctionReturnType, ServiceRef } from './api'
import { type Auth, requireHeadcodeUser } from './authorization'
import { getMcpIdentity } from './auth'
import { getDb } from './db'
import { callService } from './services'

export { api } from './api'
export { HeadcodeError } from './authorization'

// Server-side calls in the style of convex/nextjs. `token` is an MCP OAuth
// access token that app/mcp/auth.ts has already verified.
type Options = { token?: string; auth?: Auth }

const toAuth = ({ token, auth }: Options = {}): Auth =>
  auth ?? (token ? { identity: getMcpIdentity(token) } : {})

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
