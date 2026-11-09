// Compares this app with a sibling Headcode app (for example apps/cloudflare
// and apps/local). Platform code lives only in the seams listed below; any
// other difference is drift and makes this script fail.
// Usage: pnpm drift ../cloudflare
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// Files that may differ or exist in one app only (union of all apps).
const allowed = [
  // seams
  /^headcode\/(db|images|auth)\.ts$/,
  /^headcode\/auth-client\.tsx$/,
  /^headcode\/(better-auth|auth-schema)\.ts$/,
  // auth routes and pages of one provider
  /^app\/callback\//,
  /^app\/api\/auth\//,
  /^app\/\(admin\)\/admin\/(login|consent|session|logout)\//,
  // platform config, tooling, and migrations
  /^(cloudflare\.config|vite\.config|vitest\.config|drizzle\.config)\.ts$/,
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.json)$/,
  /^(eslint\.config\.mjs|\.gitignore|\.prettierignore)$/,
  /^drizzle\/(meta\/|0001_)/,
  /^test\//,
  /^scripts\/release\.mts$/,
  // docs and demo content
  /^(README|AGENTS|CHANGELOG)\.md$/,
  /^headcode\/defaults\.ts$/,
]
const ignored =
  /^(node_modules|\.next|\.turbo|\.cloudflare|\.vinext|\.parity|dist|data|coverage)(\/|$)|^\.env|^next-env\.d\.ts$|\.tsbuildinfo$|\.DS_Store$/

const other = process.argv[2]
if (!other) throw new Error('Usage: pnpm drift <path to the other app>')

const files = (root: string) => {
  const out = new Set<string>()
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      const rel = relative(root, path)
      if (ignored.test(rel)) continue
      if (statSync(path).isDirectory()) walk(path)
      else out.add(rel)
    }
  }
  walk(root)
  return out
}

const here = files('.')
const there = files(other)
const isAllowed = (path: string) => allowed.some((rule) => rule.test(path))
const drift: string[] = []
for (const path of new Set([...here, ...there])) {
  if (isAllowed(path)) continue
  if (!here.has(path)) drift.push(`only in ${other}: ${path}`)
  else if (!there.has(path)) drift.push(`only here: ${path}`)
  else if (!readFileSync(path).equals(readFileSync(join(other, path))))
    drift.push(`differs: ${path}`)
}

if (drift.length) {
  console.error(drift.sort().join('\n'))
  console.error(`\n${drift.length} file(s) drift outside the seams.`)
  process.exit(1)
}
console.log(`No drift: ${here.size} files, platform code only in the seams.`)
