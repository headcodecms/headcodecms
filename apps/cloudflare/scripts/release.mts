// Builds and deploys the Worker, then seeds it. The live and draft hosts come from
// `domains` in cloudflare.config.ts (first = live, second = draft).
// Usage: pnpm release [--secrets-file <path>]   (first deploy: the file sets
// WORKOS_CLIENT_ID, WORKOS_COOKIE_PASSWORD, WORKOS_AUTHKIT_DOMAIN,
// ALLOWED_MCP_TOKENS as NAME=value lines)
import { execFileSync } from 'node:child_process'

type Worker = { domains?: (string | { hostname: string })[] }
const { default: config } = (await import(
  new URL('../cloudflare.config.ts', import.meta.url).href
)) as { default: { worker: Worker } }
const [live, draft] = (config.worker.domains ?? []).map((domain) =>
  typeof domain === 'string' ? domain : domain.hostname,
)
if (!live || !draft)
  throw new Error(
    'Set the live and draft host in cloudflare.config.ts (domains).',
  )

const run = (
  command: string,
  args: string[],
  env: Record<string, string> = {},
) =>
  execFileSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })

// Public values are inlined at build time; they win over .env files.
// `cf deploy` runs the Vite build itself.
console.log(`Deploying ${live} (live) and ${draft} (draft)`)
const secrets = process.argv.indexOf('--secrets-file')
run(
  'pnpm',
  [
    'exec',
    'cf',
    'deploy',
    ...(secrets > 0 ? ['--secrets-file', process.argv[secrets + 1]] : []),
  ],
  {
    NEXT_PUBLIC_SITE_URL: `https://${live}`,
    NEXT_PUBLIC_HEADCODE_VERSION: 'auto',
    NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS: draft,
  },
)

// Pending migrations and missing globals (token: see scripts/seed.mts).
run('node', ['scripts/seed.mts', `https://${live}`])
