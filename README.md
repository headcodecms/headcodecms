# Headcode CMS

Turn a vibe-coded website into a real CMS: agents edit content through a stateless MCP server, people use a simple admin UI, and changes go through draft and publish. A text change is no longer a deployment.

## Apps

Every app is a complete, standalone project. Nothing is shared between apps, so you can copy one out and own it.

| App | Stack | Status |
| --- | --- | --- |
| [`apps/vercel`](apps/vercel) | Next.js, Convex, WorkOS AuthKit, Vercel | ready |
| `apps/www` | headcodecms.com, based on `vercel` | planned |
| [`apps/cloudflare`](apps/cloudflare) | Next.js on vinext, Cloudflare Workers, D1, R2, Images, WorkOS AuthKit | beta (vinext) |
| [`apps/local`](apps/local) | Next.js on vinext, Node, SQLite, files, Better Auth, no cloud services | beta (vinext) |
| `apps/blog`, `apps/docs`, `apps/shopify` | templates based on `vercel` | planned |

## Start your own

```bash
npx degit headcodecms/headcodecms/apps/vercel my-site
cd my-site && pnpm install
```

Then follow the app's README (Convex, WorkOS, environment, run). Use `apps/cloudflare` or `apps/local` the same way for the other platforms.

Convert an existing (vibe-coded) website: tell your coding agent

```text
Convert this website into a Headcode CMS site. Follow https://headcodecms.com/convert.md
```

The steps are in [`convert.md`](convert.md).

Or add Headcode to an existing Next.js + shadcn/ui app:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

## Working in this repo

```bash
pnpm install                         # installs every app (one lockfile per app)
pnpm dev --filter headcode-vercel    # run one app (headcode-cloudflare, headcode-local)
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # all apps through Turborepo
```

`apps/cloudflare` and `apps/local` share their core and differ only in a few seam files (database, images, auth, platform config). Check that with `pnpm drift ../local` in `apps/cloudflare`.

Version 1 is on the [`v1`](https://github.com/headcodecms/headcodecms/tree/v1) branch.

## License

MIT
