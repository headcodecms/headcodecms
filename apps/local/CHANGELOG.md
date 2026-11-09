# Changelog (apps/local)

Based on `apps/cloudflare` (same core, checked with `pnpm drift ../cloudflare`). This file lists what differs on Node and core changes made here first.

## Unreleased

- Default local port is 3074 (vercel 3072, cloudflare 3073). `seo.tsx` falls back to `http://localhost`; set `NEXT_PUBLIC_SITE_URL` in `.env.local`.
- `scripts/parity.mts` is the same file in every app again: `/admin` without a session may redirect to a hosted sign-in (callback on this host, AuthKit) or to `/admin/login` on this host (Better Auth); `--login` waits for an admin page other than `/admin/login`. `parity`, `mcp`, and `seed` default to the app's dev server (port from `--port` in the `dev` script, else 3000).
- Node instead of Workers: vinext `vite build` + `vinext start` (port 3074), no `cloudflare.config.ts`, no `pnpm release`.
- Seams: `headcode/db.ts` (libSQL file, `DATABASE_URL`), `headcode/images.ts` (files in `MEDIA_DIR`, sharp, resized files cached), `headcode/auth.ts` + `headcode/auth-client.tsx` + `headcode/better-auth.ts` (Better Auth).
- Better Auth: email/password, the first account becomes the editor (`user.headcode_role`), OAuth 2.1 authorization server for MCP (`@better-auth/mcp`, CIMD and Dynamic Client Registration, JWT access tokens with `headcode_role`, live and draft `/mcp` as resources). Own `/admin/login` and `/admin/consent` pages; `app/api/auth/[...all]`.
- Migrations: `drizzle/0000_init.sql` is the same as on Cloudflare, `0001_auth.sql` adds the Better Auth tables (`headcode/auth-schema.ts`, generated with `npx auth generate`).
- Data cache is vinext's in-memory cache: run one server process.
- `pnpm db:studio`: Drizzle Studio on the local database (`dbCredentials` in `drizzle.config.ts`).
- Core changes shared with `apps/local` (kept identical, checked by `pnpm drift`):
  - `proxy.ts` calls `protectAdmin` from the auth seam and skips `/api/`; `chrome.tsx` uses `useAdminUser`; `headcode/server.ts` uses `getMcpIdentity` (no WorkOS claims in neutral code).
  - `transformImage(storageId, options)` in the images seam; the media route cancels the unused body and uses the Cache API only where it exists.
  - `app/.well-known/[...path]` also serves the authorization server metadata at the RFC 8414 path (`/.well-known/oauth-authorization-server/<issuer path>`).
  - `scripts/parity.mts`: `/admin` without a session may redirect to a hosted sign-in (callback on this host) or to `/admin/login` on this host; `--login` waits for an admin page other than `/admin/login`.
  - One font per `next/font/google` import (vinext's comma in the chunk name breaks the Node build).
  - `scripts/drift.mts` (`pnpm drift ../local`).
