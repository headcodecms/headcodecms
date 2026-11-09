# Headcode CMS (local) – Agent Guide

Setup and production steps are in `README.md`. This file contains the rules.

## Stack and rules

- Next.js 16 App Router on Node via [vinext](https://github.com/cloudflare/vinext) (Vite), React 19, TypeScript, SQLite (libSQL) + Drizzle, sharp, Better Auth, shadcn/ui (base-ui), kibo-ui, TipTap, Zod, Vitest, pnpm.
- Ask before you add dependencies. Make the smallest change, with arrow functions, single quotes, and no semicolons.
- `components/` and `lib/` hold generated shadcn/kibo code. Do not put app code there. Local patches: the TipTap `signal` pass-through in `components/kibo-ui/editor`, and `render` on `DialogStackNext`/`DialogStackPrevious` in `components/kibo-ui/dialog-stack` (shadcn turns `asChild` into `render`). Keep `headcode/utils.ts` the only registry file named `utils` (with two, shadcn rewrites `utils` imports to the first one).
- Do not start `pnpm dev` if it is already running (http://localhost:3074).
- Data lives in `data/` (gitignored): `headcode.db` (`DATABASE_URL`) and `media/` (`MEDIA_DIR`). `pnpm db:studio` opens the database in Drizzle Studio; direct edits there show on the site after the cache expires (up to an hour) or the next save in the admin or MCP.

## Seams

Platform code lives only in these files, with the same exports in `apps/cloudflare` and `apps/local`. Everything else must stay byte-identical between the two apps: `pnpm drift ../<other app>` fails on any other difference (allowed files are listed in `scripts/drift.mts`). Fix core code in both apps and keep them in sync.

Auth seam exports: `getAdminIdentity`, `protectAdmin` (proxy.ts), `verifyMcpAccessToken`, `getMcpIdentity`, `authServerMetadata` (`headcode/auth.ts`); `AuthProvider`, `useAdminUser`, `Authenticated`, `AuthLoading`, `Unauthenticated` (`headcode/auth-client.tsx`). Images seam: `imageSrc`, `storeImage`, `readImage`, `deleteStoredImage`, `imageMetadata`, `transformImage`. Database seam: `getDb`.

| File                                                                     | Here                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `headcode/db.ts`                                                         | libSQL file (`DATABASE_URL`, default `file:data/headcode.db`); `authDb` for Better Auth       |
| `headcode/images.ts`                                                     | files in `MEDIA_DIR`, sharp for dimensions, ThumbHash, and resizing (cached under `resized/`) |
| `headcode/auth.ts`, `headcode/better-auth.ts`, `headcode/auth-schema.ts` | Better Auth: sessions, admin redirect to `/admin/login`, OAuth 2.1 server for MCP             |
| `headcode/auth-client.tsx`                                               | Better Auth client (`oauthProviderClient`), admin user, auth gates                            |
| `app/api/auth`, `app/(admin)/admin/login`, `app/(admin)/admin/consent`   | Better Auth handler, sign-in/sign-up page, OAuth consent page                                 |
| `vite.config.ts`                                                         | vinext for Node                                                                               |

## Architecture

- `headcode/services.ts` is the only API for the site, the admin, and MCP. It keeps the shape of the original Convex services: documents have `_id` and `_creationTime`, entries point to `version`, sections to `entry`. The schema is `headcode/schema.ts` (Drizzle, SQLite).
- Callers use Convex-style helpers, so their code stays the same as in `apps/vercel`:
  - server (site, MCP): `fetchQuery`/`fetchMutation` from `headcode/server.ts`,
  - admin (client): `useQuery`, `useMutation`, `usePaginatedQuery` from `headcode/client.tsx`. They call `POST /admin/services` (`app/(admin)/admin/services/route.ts`), and after each mutation every mounted query refetches.
  - references: `api.services.<name>` from `headcode/api.ts` (just the name; no server code on the client).
- `callService` checks access: public queries, `adminQuery` (signed-in user), `adminMutation` (editor). `requireHeadcodeUser` in `headcode/authorization.ts` allows a write for:
  - an admin user with the editor role (`user.headcodeRole` from the Better Auth session),
  - an MCP OAuth token issued by Better Auth (`headcode_role` claim of the verified JWT),
  - an MCP bearer token from `ALLOWED_MCP_TOKENS`, passed as `mcpToken`.
- Sign-up is open. Every user may read the admin; writes need the role `editor` (`user.headcode_role`; the first account of an install gets it, `databaseHooks` in `better-auth.ts`), otherwise `requireHeadcodeUser` throws a `HeadcodeError` asking for activation. The admin UI shows it via `errorMessage` (`_lib/use-actions.ts`), MCP as the tool error.
- Section data is stored as JSON strings. `headcode/section_validations.ts` validates it against the field Zod validators: unknown keys are dropped. Writes (admin, MCP, seed) with invalid values are rejected with a `HeadcodeError` naming each field; reads fall back to defaults, so old data still renders. Formats such as numbers are a custom `validator` on a text field (`TextField({ validator: z.string().regex(...) })`), not a new field type. `headcode_list_section_types` returns each field's JSON Schema.
- The database is the only source of content. `seed` in `headcode/services.ts` fills it from `headcode/config.ts`: an empty install gets one shared version and sample entries, every run adds missing globals. Reads never fall back to config defaults.
- Schema changes: edit `headcode/schema.ts` (Better Auth tables: `npx auth generate --config headcode/better-auth.ts --output headcode/auth-schema.ts`), run `pnpm db:generate` (writes SQL to `drizzle/`), then `pnpm seed <url>`; it applies pending migrations (`headcode/migrate.ts`, table `__migrations`) before seeding. Run it after each deploy. Services avoid interactive transactions and chunk inserts to 100 bound parameters (`insertMany`), so the same code runs on D1.
- Images:
  - Uploads are files in `MEDIA_DIR`. `generateImageUploadUrl` returns a one-time URL (`/media/upload/<ticket>`, ticket in the `uploads` table); MCP uploads from URLs store directly.
  - `/media/<key>` serves the file; `/media/<key>?w=<width>` returns a resized AVIF/WebP/JPEG (sharp, cached as a file). Widths are `mediaWidths` in `headcode/utils.ts`.
  - The site renders uploaded images with `<img srcSet={mediaSrcSet(src)}>` (`Visual` in `app/(site)/_sections/shared.tsx`), the same as `apps/cloudflare`.
- Content model, configured in `headcode/config.ts`:
  - **sections** (`headcode/sections.ts`) contain **fields** (`headcode/fields.ts`). Lists are `ListField({ label, description, fields })`.
  - **entries** are either **globals** (a single entry per slug) or **collections** (repeatable entries).
  - image fields store `{ imageId }`.
- Versions are `live` and `draft`. Publishing promotes the draft to live and clones a new draft. `headcode/versions.ts` picks the version from the request host (`NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`), the same way for site, admin, and MCP. One server process serves both hosts.
- `proxy.ts` handles two things:
  - Site rewrites: every site URL goes to `/live/...` or `/draft/...` (`app/(site)/[version]`, root param read with `siteVersion()`), and `?md` / `Accept: text/markdown` go to `/[version]/headcode-markdown.txt/...`. Direct `/live` and `/draft` URLs return 404. `/api/`, `/mcp`, `/media/`, `/callback`, and `/.well-known/` are not rewritten.
  - The admin session (`protectAdmin`): `/admin/*` without a Better Auth session cookie redirects to `/admin/login?next=...`; the login and consent pages stay open.
- `app/mcp/route.ts` is a stateless MCP server (`@modelcontextprotocol/server` v2, `legacy: 'reject'`). It checks Origin and the bearer token (`app/mcp/auth.ts`: Better Auth OAuth JWT with audience = `/mcp` URL of the request host, or a shared token). OAuth discovery is served by `app/.well-known/[...path]/route.ts` (protected resource metadata, and the Better Auth server metadata, also at the RFC 8414 path `/.well-known/oauth-authorization-server/api/auth`). New OAuth clients are linked to the live and the draft `/mcp` URL (`clientRegistrationDefaultResources`). `app/mcp/seed/route.ts` (shared token only) runs migrations and the seed. MCP tools must keep parity with admin entry and section operations, and must never publish unless the user explicitly asks.
- The site renders HTML and Markdown from the same validated section data (`app/(site)/_sections`).
- SEO lives in `app/(site)/_lib/seo.tsx`: every page's `generateMetadata` returns `pageMetadata(...)` (canonical, Open Graph, Twitter card), structured data uses `<JsonLd>`. Draft hosts are `noindex` (layout) and disallowed in `app/robots.ts`.
- Caching uses Next.js Cache Components (`cacheComponents`; vinext support is experimental) for data only:
  - All site reads go through `cachedQuery` in `app/(site)/_lib/headcode.ts` (`'use cache'`, `cacheLife('hours')`, tag `headcode`). The cache is vinext's in-memory cache of the server process, so run a single process.
  - Pages are not cached: `app/(site)/[version]/layout.tsx` calls `connection()` (same code as `apps/cloudflare`, where vinext's page cache kept stale HTML). A missing page answers with status 200 and `noindex` (soft 404).
  - Every write calls `expireSite()` (`app/(site)/_lib/headcode.ts`): the `headcode` tag and the implicit root layout path tag `_N_T_/layout` expire.
  - Do not read `headers()`, `cookies()` or uncached data in site pages; pass the version from `siteVersion()` into the cached helpers.

## Checks

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
pnpm drift ../cloudflare                             # no core drift to apps/cloudflare
pnpm seed http://localhost:3074                      # migrations + seed of data/headcode.db
pnpm db:studio                                       # Drizzle Studio on data/headcode.db
pnpm mcp http://draft.localhost:3074/mcp headcode_get_version
pnpm parity http://draft.localhost:3074 --write
pnpm parity http://localhost:3074 --login            # once per host: sign in or create an account
pnpm parity http://localhost:3074 --admin --write    # admin theme, entries, edit in the admin
pnpm build && pnpm start                             # then the same parity runs against the Node server
```

- `scripts/parity.mts` is the contract every Headcode app keeps (MCP auth, tool list and annotations, site formats, edit-to-site cycle). Change it only together with the behavior, and note it in `CHANGELOG.md`.
- Before changing Next.js code, read `node_modules/next/dist/docs/`. For vinext limits run `pnpm dlx vinext check`. Better Auth plugin docs: `node_modules/@better-auth/*/README.md` and better-auth.com/docs/plugins/mcp.
- Admin sign-in is the app's own page (`/admin/login`). A human signs in once (`--login`); the session is saved in `.parity/<host>.json` (gitignored, a secret) and `--admin` reuses it. The first account of a fresh database becomes the editor, so do not create test accounts in a user's database.
- `vite.config` must not produce chunk names with `%` (Node decodes it in import URLs): keep one font per `next/font/google` import.
- An install or change is not done until `--admin --write` passes: the admin must look like stock Headcode and work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
