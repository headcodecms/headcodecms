# Changelog (apps/cloudflare)

Based on `apps/vercel` (see its CHANGELOG for core changes). This file lists what differs on Cloudflare and core changes made here first.

## Unreleased

- Fix: the admin no longer loads the site's global CSS in production. vinext attaches CSS imported by a server layout to the RSC entry, which the admin layout imports, so a site with its own `globals.css` (colors, fonts) changed the admin look. The site layout now renders `app/(site)/_components/site-styles.tsx`, a client component that imports `globals.css`; client CSS loads only where it renders. Found by converting a fresh `create-next-app` site (`body { font-family: Arial }` showed in the admin). The reference apps did not show it, because their `globals.css` has the same theme as the admin.
- Registry item `headcode-cloudflare` in the root `registry.json` (installed by convert.md for this platform), with the style's base packages (`shadcn`, `@base-ui/react`, `class-variance-authority`, `lucide-react`) and `postcss.config.mjs`, so it installs into a site without `shadcn init`.

- Atomic writes: publish, new draft, restore, delete version, add/delete entry, add/update/duplicate/reorder/delete section run as one `db.batch` (D1 and libSQL execute a batch as one transaction). IDs are generated up front.
- Fix: inserts are chunked by the table's column count (defaults like `_id` and `_creationTime` are bound too). Before, cloning a version with many sections exceeded D1's 100 bound parameters, so new draft and publish failed on Cloudflare (parity never publishes, so it did not show).
- Missing pages stay soft 404s (200 + `noindex`): vinext 1.4 answers 200 even for unmatched routes and ignores a 404 status set by the proxy.
- Default local port is 3073 (vercel 3072, local 3074). `seo.tsx` falls back to `http://localhost`; set `NEXT_PUBLIC_SITE_URL` in `.env.local`.
- `scripts/parity.mts` is the same file in every app again: `/admin` without a session may redirect to a hosted sign-in (callback on this host, AuthKit) or to `/admin/login` on this host (Better Auth); `--login` waits for an admin page other than `/admin/login`. `parity`, `mcp`, and `seed` default to the app's dev server (port from `--port` in the `dev` script, else 3000).
- Core changes shared with `apps/local` (kept identical, checked by `pnpm drift`):
  - `proxy.ts` calls `protectAdmin` from the auth seam and skips `/api/`; `chrome.tsx` uses `useAdminUser`; `headcode/server.ts` uses `getMcpIdentity` (no WorkOS claims in neutral code).
  - `transformImage(storageId, options)` in the images seam; the media route cancels the unused body and uses the Cache API only where it exists.
  - `app/.well-known/[...path]` also serves the authorization server metadata at the RFC 8414 path (`/.well-known/oauth-authorization-server/<issuer path>`).
  - `scripts/parity.mts`: `/admin` without a session may redirect to a hosted sign-in (callback on this host) or to `/admin/login` on this host; `--login` waits for an admin page other than `/admin/login`.
  - One font per `next/font/google` import (vinext's comma in the chunk name breaks the Node build).
  - `scripts/drift.mts` (`pnpm drift ../local`).
- Runs on Cloudflare Workers via vinext (`vinext init --platform=cloudflare`, KV data cache, Images optimizer). `cloudflare.config.ts` declares the Worker, the bindings, the server secrets, and both domains (one Worker serves live and draft, so they share one cache).
- Convex replaced by D1 + Drizzle (`headcode/schema.ts`, `headcode/services.ts`) with the same service names, args, and document shapes. Callers use Convex-style helpers: `headcode/server.ts` (`fetchQuery`/`fetchMutation`) and `headcode/client.tsx` (`useQuery`/`useMutation`/`usePaginatedQuery` via `POST /admin/services`).
- Seams for platform code: `headcode/db.ts`, `headcode/images.ts`, `headcode/auth.ts`, `headcode/auth-client.tsx`. Everything else is platform-neutral.
- Images in R2, served by `/media/<key>`; `?w=` resizes with the Images binding (cached). `Visual` renders a `srcset`, because vinext's `next/image` only optimizes static files. `sharp` is gone; dimensions and ThumbHash come from the Images binding.
- One-time upload URLs are tickets in the `uploads` table (`/media/upload/<ticket>`).
- Migrations: `pnpm db:generate` (drizzle-kit) and `pnpm seed <url>` (applies `drizzle/` via `headcode/migrate.ts`, then seeds; `app/mcp/seed/route.ts`, shared token only).
- `pnpm release`: build with `NEXT_PUBLIC_SITE_URL` and the draft host from `cloudflare.config.ts`, `cf deploy` (first run with `--secrets-file`), then seed.
- Service tests run on in-memory libSQL with a convex-test-like harness.
- `scripts/parity.mts`, `scripts/mcp-smoke.mts`, `scripts/seed.mts` default to port 3073. `parity.mts` types the OAuth metadata body (Workers types make `json()` return `unknown`).
- Cache: Workers Response Store (self-contained) instead of the KV data cache, whose tag markers can be a minute stale per edge location (parity failed about every second run). Pages are not cached (`connection()` in the site layout): vinext's page ISR kept stale HTML after repeated writes. Writes call `expireSite()`. Missing pages are soft 404s (200 + `noindex`).
- The admin works under `pnpm dev`: the client auth seam no longer uses AuthKit's client components (Vite pre-bundled them with AuthKit's server actions). It reads `/admin/session` and signs out via `/admin/logout`.
