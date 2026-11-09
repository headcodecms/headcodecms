# Headcode CMS (Cloudflare) – Agent Guide

Setup and deploy steps are in `README.md`. This file contains the rules.

## Stack and rules

- Next.js 16 App Router on Cloudflare Workers via [vinext](https://github.com/cloudflare/vinext) (Vite), React 19, TypeScript, D1 + Drizzle, R2, Cloudflare Images binding, WorkOS AuthKit, shadcn/ui (base-ui), kibo-ui, TipTap, Zod, Vitest, pnpm.
- Ask before you add dependencies. Make the smallest change, with arrow functions, single quotes, and no semicolons.
- `components/` and `lib/` hold generated shadcn/kibo code. Do not put app code there. Local patches: the TipTap `signal` pass-through in `components/kibo-ui/editor`, and `render` on `DialogStackNext`/`DialogStackPrevious` in `components/kibo-ui/dialog-stack` (shadcn turns `asChild` into `render`). Keep `headcode/utils.ts` the only registry file named `utils` (with two, shadcn rewrites `utils` imports to the first one).
- Do not start `pnpm dev` if it is already running (http://localhost:3073).
- `cloudflare.config.ts` (the `cf` CLI format, not `wrangler.jsonc`) defines the Worker, its bindings, and the live and draft domains. Every server-side env value must be declared there (`bindings.secret()`), otherwise `process.env` is empty on Workers. Use the `cf` CLI, not Wrangler.

## Seams

Platform code lives only in these files, with the same exports in `apps/cloudflare` and `apps/local`. Everything else must stay byte-identical between the two apps: `pnpm drift ../<other app>` fails on any other difference (allowed files are listed in `scripts/drift.mts`). Fix core code in both apps and keep them in sync.

Auth seam exports: `getAdminIdentity`, `protectAdmin` (proxy.ts), `verifyMcpAccessToken`, `getMcpIdentity`, `authServerMetadata` (`headcode/auth.ts`); `AuthProvider`, `useAdminUser`, `Authenticated`, `AuthLoading`, `Unauthenticated` (`headcode/auth-client.tsx`). Images seam: `imageSrc`, `storeImage`, `readImage`, `deleteStoredImage`, `imageMetadata`, `transformImage`. Database seam: `getDb`.

| File                                                                                | Here                                                                                          |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `headcode/db.ts`                                                                    | `drizzle(env.DB)` on D1                                                                       |
| `headcode/images.ts`                                                                | R2 (`env.MEDIA`) storage, `env.IMAGES` for dimensions, ThumbHash, and resizing                |
| `headcode/auth.ts`, `app/callback`, `app/(admin)/admin/login`                       | AuthKit session, admin redirect, MCP OAuth token check                                        |
| `headcode/auth-client.tsx`, `app/(admin)/admin/session`, `app/(admin)/admin/logout` | admin session and sign-out through server routes (no AuthKit code in the browser), auth gates |
| `cloudflare.config.ts`, `vite.config.ts`                                            | Worker, bindings, domains, vinext plugins                                                     |

## Architecture

- `headcode/services.ts` is the only API for the site, the admin, and MCP. It keeps the shape of the original Convex services: documents have `_id` and `_creationTime`, entries point to `version`, sections to `entry`. The schema is `headcode/schema.ts` (Drizzle, SQLite).
- Callers use Convex-style helpers, so their code stays the same as in `apps/vercel`:
  - server (site, MCP): `fetchQuery`/`fetchMutation` from `headcode/server.ts`,
  - admin (client): `useQuery`, `useMutation`, `usePaginatedQuery` from `headcode/client.tsx`. They call `POST /admin/services` (`app/(admin)/admin/services/route.ts`), and after each mutation every mounted query refetches.
  - references: `api.services.<name>` from `headcode/api.ts` (just the name; no server code on the client).
- `callService` checks access: public queries, `adminQuery` (signed-in user), `adminMutation` (editor). `requireHeadcodeUser` in `headcode/authorization.ts` allows a write for:
  - an admin user with the editor role (claim from the AuthKit session),
  - an MCP OAuth token issued by AuthKit (claims of the verified JWT),
  - an MCP bearer token from `ALLOWED_MCP_TOKENS`, passed as `mcpToken`.
- Sign-up is open. Every user may read the admin; writes need the token claim `headcode_role: "editor"` (WorkOS user metadata, copied by the environment's JWT template), otherwise `requireHeadcodeUser` throws a `HeadcodeError` asking for activation. The admin UI shows it via `errorMessage` (`_lib/use-actions.ts`), MCP as the tool error.
- Section data is stored as JSON strings. `headcode/section_validations.ts` validates it against the field Zod validators: unknown keys are dropped. Writes (admin, MCP, seed) with invalid values are rejected with a `HeadcodeError` naming each field; reads fall back to defaults, so old data still renders. Formats such as numbers are a custom `validator` on a text field (`TextField({ validator: z.string().regex(...) })`), not a new field type. `headcode_list_section_types` returns each field's JSON Schema.
- The database is the only source of content. `seed` in `headcode/services.ts` fills it from `headcode/config.ts`: an empty install gets one shared version and sample entries, every run adds missing globals. Reads never fall back to config defaults.
- Schema changes: edit `headcode/schema.ts`, run `pnpm db:generate` (writes SQL to `drizzle/`), then `pnpm seed <url>`; it applies pending migrations (`headcode/migrate.ts`, table `__migrations`) before seeding. `pnpm release` does this after each deploy. Writes that belong together run as one `commit(db, statements)` (a `db.batch`, one transaction on D1 and libSQL); D1 has no interactive transactions. A statement takes at most 100 bound parameters, so `insertRows` chunks inserts by the table's column count.
- Images:
  - Uploads go to R2. `generateImageUploadUrl` returns a one-time URL (`/media/upload/<ticket>`, ticket in the `uploads` table); MCP uploads from URLs store directly.
  - `/media/<key>` serves the file; `/media/<key>?w=<width>` returns a resized AVIF/WebP/JPEG (Images binding, Cache API). Widths are `mediaWidths` in `headcode/utils.ts`.
  - The site renders uploaded images with `<img srcSet={mediaSrcSet(src)}>` (`Visual` in `app/(site)/_sections/shared.tsx`). vinext's `next/image` only optimizes static files, so do not use it for uploads.
- Content model, configured in `headcode/config.ts`:
  - **sections** (`headcode/sections.ts`) contain **fields** (`headcode/fields.ts`). Lists are `ListField({ label, description, fields })`.
  - **entries** are either **globals** (a single entry per slug) or **collections** (repeatable entries).
  - image fields store `{ imageId }`.
- Versions are `live` and `draft`. Publishing promotes the draft to live and clones a new draft. `headcode/versions.ts` picks the version from the request host (`NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`), the same way for site, admin, and MCP. One Worker serves both hosts.
- `proxy.ts` handles two things:
  - Site rewrites: every site URL goes to `/live/...` or `/draft/...` (`app/(site)/[version]`, root param read with `siteVersion()`), and `?md` / `Accept: text/markdown` go to `/[version]/headcode-markdown.txt/...`. Direct `/live` and `/draft` URLs return 404. `/mcp`, `/media/`, `/callback`, and `/.well-known/` are not rewritten.
  - The AuthKit session. Unauthenticated `/admin/*` requests are sent to AuthKit, with the callback on the request host.
- `app/mcp/route.ts` is a stateless MCP server (`@modelcontextprotocol/server` v2, `legacy: 'reject'`). It checks Origin and the bearer token (`app/mcp/auth.ts`: AuthKit OAuth JWT with audience = `/mcp` URL of the request host, or a shared token). OAuth discovery is served by `app/.well-known/[...path]/route.ts`. `app/mcp/seed/route.ts` (shared token only) runs migrations and the seed. MCP tools must keep parity with admin entry and section operations, and must never publish unless the user explicitly asks.
- The site renders HTML and Markdown from the same validated section data (`app/(site)/_sections`).
- SEO lives in `app/(site)/_lib/seo.tsx`: every page's `generateMetadata` returns `pageMetadata(...)` (canonical, Open Graph, Twitter card), structured data uses `<JsonLd>`. Draft hosts are `noindex` (layout) and disallowed in `app/robots.ts`.
- Caching uses Next.js Cache Components (`cacheComponents`; vinext support is experimental) for data only:
  - All site reads go through `cachedQuery` in `app/(site)/_lib/headcode.ts` (`'use cache'`, `cacheLife('hours')`, tag `headcode`). The data cache is the Workers Response Store (`vite.config.ts`, self-contained: R2 bucket for bodies, Durable Object for tags). Its tag invalidation is consistent across edge locations; the KV data cache was not (markers up to a minute stale).
  - Pages are not cached: `app/(site)/[version]/layout.tsx` calls `connection()`, so every page renders per request from cached data. vinext's page ISR cache kept stale HTML after repeated writes (pages rendered from data-cache hits lose the `headcode` tag). Side effect: a missing page answers with status 200 and `noindex` (soft 404), not 404.
  - Every write calls `expireSite()` (`app/(site)/_lib/headcode.ts`). It expires the `headcode` tag and the implicit root layout path tag `_N_T_/layout`: vinext can store a data entry again without `headcode` when it was filled from a cache hit. Callers: the admin in `app/(admin)/admin/services/route.ts`, MCP in `app/mcp/route.ts`, and the seed route. Writes from elsewhere (D1 console, scripts) show after at most one hour.
  - Do not read `headers()`, `cookies()` or uncached data in site pages; pass the version from `siteVersion()` into the cached helpers.
  - Check cache changes with repeated writes to the same page (`pnpm parity <url> --admin --write` a few times in a row); a single write passed even with the broken page cache.

## Checks

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
pnpm drift ../local                                  # no core drift to apps/local
pnpm seed http://localhost:3073                      # migrations + seed of the local D1
pnpm mcp http://draft.localhost:3073/mcp headcode_get_version
pnpm parity http://draft.localhost:3073 --write
pnpm parity http://localhost:3073 --login            # once per host: a human signs in
pnpm parity http://localhost:3073 --admin --write    # admin theme, entries, edit in the admin
pnpm parity https://<host> --admin --write           # after each deploy, live and draft host
```

- `scripts/parity.mts` is the contract every Headcode app keeps (MCP auth, tool list and annotations, site formats, edit-to-site cycle). Change it only together with the behavior, and note it in `CHANGELOG.md`.
- Before changing Next.js code, read `node_modules/next/dist/docs/`. For vinext limits run `pnpm dlx vinext check`.
- Do not import `@workos-inc/authkit-nextjs/components` in client code: Vite pre-bundles them together with AuthKit's server actions (`server-only`), and the admin breaks under `pnpm dev`. The client seam reads `/admin/session` and signs out via `/admin/logout`; `proxy.ts` refreshes the session on every `/admin` request.
- Locally the Images binding cannot output raw RGBA, so uploads get a grey blur placeholder; deployed Workers compute the real one.
- Admin sign-in uses the hosted AuthKit page. A human has to sign in once (`--login`); the session is saved in `.parity/<host>.json` (gitignored, a secret) and `--admin` reuses it.
- An install or change is not done until `--admin --write` passes: the admin must look like stock Headcode and work.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
