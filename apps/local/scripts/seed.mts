// Applies migrations and seeds the database of a running Headcode app.
// Usage: pnpm seed [base-url]   (default: the dev server)   (token: MCP_TOKEN, .parity/<host>.env, or
// the first ALLOWED_MCP_TOKENS value from .env.local)
import { existsSync, readFileSync } from 'node:fs'

// The app's dev server: the port of `--port` in the dev script, else 3000.
const devPort =
  /--port[ =](\d+)/.exec(
    JSON.parse(readFileSync('package.json', 'utf8')).scripts?.dev ?? '',
  )?.[1] ?? '3000'

const base = new URL(process.argv[2] ?? `http://localhost:${devPort}`)
if (existsSync(`.parity/${base.host}.env`))
  process.loadEnvFile(`.parity/${base.host}.env`)
const token =
  process.env.MCP_TOKEN ?? process.env.ALLOWED_MCP_TOKENS?.split(',')[0]?.trim()
if (!token) throw new Error('No MCP token (MCP_TOKEN or ALLOWED_MCP_TOKENS).')

const res = await fetch(new URL('/mcp/seed', base), {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
})
console.log(res.status, await res.text())
if (!res.ok) process.exit(1)
