import { ConvexError } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'

// Constant-time comparison for shared bearer tokens.
const safeEqual = (a: string, b: string) =>
  a.length === b.length &&
  [...a].reduce(
    (diff, char, i) => diff | (char.charCodeAt(0) ^ b.charCodeAt(i)),
    0,
  ) === 0

export const isAllowedMcpToken = (token?: string) =>
  !!token &&
  (process.env.ALLOWED_MCP_TOKENS ?? '')
    .split(',')
    .map((allowed) => allowed.trim())
    .some((allowed) => allowed && safeEqual(allowed, token))

export const editorRequired =
  'Your account must be activated by an administrator before you can change content.'

// Every WorkOS user may read the admin. Writes need the `headcode_role`
// claim "editor" (WorkOS user metadata, added by the JWT template) or the
// shared MCP bearer token.
export const requireHeadcodeUser = async (
  ctx: QueryCtx | MutationCtx,
  mcpToken?: string,
  write = false,
) => {
  if (isAllowedMcpToken(mcpToken)) return
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated.')
  if (write && identity.headcode_role !== 'editor')
    throw new ConvexError(editorRequired)
}
