// Applies migrations and seeds the database of a running Headcode app.
// Usage: pnpm seed [base-url]   (token: MCP_TOKEN, .parity/<host>.env, or
// the first ALLOWED_MCP_TOKENS value from .env.local)
import { existsSync } from 'node:fs'

const base = new URL(process.argv[2] ?? 'http://localhost:3001')
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
