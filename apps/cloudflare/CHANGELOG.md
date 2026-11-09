# Changelog (apps/cloudflare)

Based on `apps/vercel` (see its CHANGELOG for core changes). This file lists what differs on Cloudflare and core changes made here first.

## Unreleased

- Runs on Cloudflare Workers via vinext (`vinext init --platform=cloudflare`, KV data cache, Images optimizer). `cloudflare.config.ts` declares the Worker, the bindings, the server secrets, and both domains (one Worker serves live and draft, so they share one cache).
- Convex replaced by D1 + Drizzle (`headcode/schema.ts`, `headcode/services.ts`) with the same service names, args, and document shapes. Callers use Convex-style helpers: `headcode/server.ts` (`fetchQuery`/`fetchMutation`) and `headcode/client.tsx` (`useQuery`/`useMutation`/`usePaginatedQuery` via `POST /admin/services`).
- Seams for platform code: `headcode/db.ts`, `headcode/images.ts`, `headcode/auth.ts`, `headcode/auth-client.tsx`. Everything else is platform-neutral.
- Images in R2, served by `/media/<key>`; `?w=` resizes with the Images binding (cached). `Visual` renders a `srcset`, because vinext's `next/image` only optimizes static files. `sharp` is gone; dimensions and ThumbHash come from the Images binding.
- One-time upload URLs are tickets in the `uploads` table (`/media/upload/<ticket>`).
- Migrations: `pnpm db:generate` (drizzle-kit) and `pnpm seed <url>` (applies `drizzle/` via `headcode/migrate.ts`, then seeds; `app/mcp/seed/route.ts`, shared token only).
- `pnpm release`: build with `NEXT_PUBLIC_SITE_URL` and the draft host from `cloudflare.config.ts`, `cf deploy` (first run with `--secrets-file`), then seed.
- Service tests run on in-memory libSQL with a convex-test-like harness.
- `scripts/parity.mts`, `scripts/mcp-smoke.mts`, `scripts/seed.mts` default to port 3001. `parity.mts` types the OAuth metadata body (Workers types make `json()` return `unknown`).
- Cache: Workers Response Store (self-contained) instead of the KV data cache, whose tag markers can be a minute stale per edge location (parity failed about every second run). Pages are not cached (`connection()` in the site layout): vinext's page ISR kept stale HTML after repeated writes. Writes call `expireSite()`. Missing pages are soft 404s (200 + `noindex`).
- Known: the admin does not load under `pnpm dev` (AuthKit pre-bundling); use `pnpm build && pnpm preview`.
