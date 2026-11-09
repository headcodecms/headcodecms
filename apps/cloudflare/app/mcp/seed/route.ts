import { isAllowedMcpToken } from '@/headcode/authorization'
import { getDb } from '@/headcode/db'
import { migrate } from '@/headcode/migrate'
import { seed } from '@/headcode/services'

// `pnpm seed <url>`: applies pending migrations and seeds the database from
// headcode/config.ts. Needs the shared MCP token (scripts only).
export const POST = async (req: Request) => {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!isAllowedMcpToken(token))
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  const db = getDb()
  const migrated = await migrate(db)
  await seed(db)
  return Response.json({ migrated, seeded: true })
}
