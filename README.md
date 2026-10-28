# Headcode CMS

Turn a vibe-coded website into a real CMS: agents edit content through a stateless MCP server, people use a simple admin UI, and changes go through draft and publish. A text change is no longer a deployment.

## Apps

Every app is a complete, standalone project. Nothing is shared between apps, so you can copy one out and own it.

| App | Stack | Status |
| --- | --- | --- |
| [`apps/workos`](apps/workos) | Next.js, Convex, WorkOS AuthKit, Vercel | ready |
| `apps/www` | headcodecms.com, based on `workos` | planned |
| `apps/betterauth` | Next.js, BetterAuth, Drizzle (SQLite/Postgres), no cloud services | planned |
| `apps/blog`, `apps/docs`, `apps/shopify` | templates based on `workos` | planned |

## Start your own

```bash
npx degit headcodecms/headcodecms/apps/workos my-site
cd my-site && pnpm install
```

Then follow the app's README (Convex, WorkOS, environment, run).

Or add Headcode to an existing Next.js + shadcn/ui app:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

## Working in this repo

```bash
pnpm install                         # installs every app (one lockfile per app)
pnpm dev --filter headcode-workos    # run one app
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # all apps through Turborepo
```

Version 1 is on the [`v1`](https://github.com/headcodecms/headcodecms/tree/v1) branch.

## License

MIT
