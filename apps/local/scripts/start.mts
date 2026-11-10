// Production start (`pnpm start`): runs the vinext server and, once it
// answers, applies pending migrations and seeds (scripts/seed.mts).
import { spawn } from 'node:child_process'

const port = process.env.PORT ?? '3074'
const server = spawn('pnpm', ['exec', 'vinext', 'start', '--port', port], {
  stdio: 'inherit',
})
server.on('exit', (code) => process.exit(code ?? 1))
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => server.kill(signal))

const base = `http://localhost:${port}`
for (let i = 0; i < 60; i++) {
  const ok = await fetch(`${base}/robots.txt`)
    .then((res) => res.ok)
    .catch(() => false)
  if (ok) break
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
spawn('node', ['scripts/seed.mts', base], { stdio: 'inherit' })
