import type { MutationCtx, QueryCtx } from './_generated/server'

type AuthCtx = QueryCtx | MutationCtx

const safeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false

  let result = 0
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return result === 0
}

const isAllowedMcpToken = (token: string | undefined) => {
  if (!token) return false

  return (process.env.ALLOWED_MCP_TOKENS ?? '')
    .split(',')
    .map((allowedToken) => allowedToken.trim())
    .filter(Boolean)
    .some((allowedToken) => safeCompare(allowedToken, token))
}

export const requireHeadcodeUser = async (ctx: AuthCtx, mcpToken?: string) => {
  if (isAllowedMcpToken(mcpToken)) {
    return {
      name: 'Headcode MCP',
      email: null,
      subject: 'mcp',
      tokenIdentifier: 'mcp',
    }
  }

  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated.')

  return identity
}

export const requireHeadcodeWrite = async (
  ctx: MutationCtx,
  mcpToken?: string,
) => {
  return requireHeadcodeUser(ctx, mcpToken)
}

export const requireHeadcodePublish = async (
  ctx: MutationCtx,
  mcpToken?: string,
) => {
  return requireHeadcodeWrite(ctx, mcpToken)
}

export const requireHeadcodeMcp = async (ctx: AuthCtx, mcpToken?: string) => {
  return requireHeadcodeUser(ctx, mcpToken)
}
