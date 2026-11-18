import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

import { headcodeTag } from '@/app/(site)/_lib/headcode'
import { callTool, cookie, ToolError } from '@/headcode/admin'
import { deleteMedia } from '@/headcode/media'

// The admin's data API: the backend's MCP tools with the user's token.
const tools = new Set([
  'schema_get',
  'entries_list',
  'entry_get',
  'entry_update',
  'entry_delete',
  'changes_list',
  'publish',
  'snapshots_list',
  'rollback',
  'draft_reset',
  'preview_link',
  'preview_rotate',
  'media_list',
  'media_delete',
])
// The admin always edits the draft; live changes only through publish.
const draftOnly = new Set(['entry_update', 'entry_delete'])
const changesLive = new Set(['publish', 'rollback'])

export const POST = async (req: NextRequest) => {
  const token = req.cookies.get(cookie.access)?.value
  if (!token) return Response.json({ error: 'Not signed in.' }, { status: 401 })
  const { name, args } = (await req.json()) as { name: string; args?: object }
  if (!tools.has(name))
    return Response.json({ error: `Unknown tool ${name}.` }, { status: 400 })
  try {
    const result = await callTool(
      token,
      name,
      draftOnly.has(name) ? { ...args, version: 'draft' } : (args ?? {}),
    )
    if (changesLive.has(name)) revalidateTag(headcodeTag, { expire: 0 })
    // The backend forgot the file; the site stored it, so it deletes it.
    if (name === 'media_delete')
      await deleteMedia((result as { pathname: string }).pathname)
    return Response.json({ result })
  } catch (error) {
    if (!(error instanceof ToolError)) throw error
    // The backend's hint is for agents; people ask an admin.
    const message = error.message.replace(
      'A project admin can add you with member_grant.',
      'Ask a project admin to add you.',
    )
    return Response.json({ error: message }, { status: 400 })
  }
}
