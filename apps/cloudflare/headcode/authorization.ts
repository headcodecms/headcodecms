// Who may read and write. The identity comes from the auth seam (auth.ts):
// the admin session, or a verified MCP OAuth token.
export type Identity = { subject: string; headcode_role?: unknown }
export type Auth = { identity?: Identity | null; mcpToken?: string }

// User-facing errors (shown in the admin and as MCP tool errors).
export class HeadcodeError extends Error {
  constructor(readonly data: string) {
    super(data)
  }
}

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

// Every signed-in user may read the admin. Writes need the `headcode_role`
// claim "editor" (WorkOS user metadata, added by the JWT template) or the
// shared MCP bearer token.
export const requireHeadcodeUser = (auth: Auth, write = false) => {
  if (isAllowedMcpToken(auth.mcpToken)) return
  if (!auth.identity) throw new Error('Not authenticated.')
  if (write && auth.identity.headcode_role !== 'editor')
    throw new HeadcodeError(editorRequired)
}
