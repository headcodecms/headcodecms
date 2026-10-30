# Headcode CMS – Agent Guide

Setup steps are in `README.md`. This file contains the rules.

## Stack and rules

- Next.js 16 App Router, React 19, TypeScript, Convex, WorkOS AuthKit, shadcn/ui (base-ui), kibo-ui, TipTap, Zod, Vitest, pnpm.
- Ask before you add dependencies. Make the smallest change, with arrow functions, single quotes, and no semicolons.
- `components/` and `lib/` hold generated shadcn/kibo code. Do not put app code there. The one local patch is the TipTap `signal` pass-through in `components/kibo-ui/editor`.
- Do not start `pnpm dev` or `pnpm convex dev` if they are already running (http://localhost:3000).

## Architecture

- `convex/services.ts` is the only API for the site, the admin, and MCP. Database helpers live in `convex/db.ts`.
- Writes go through `adminMutation`, which calls `requireHeadcodeUser` in `convex/authorization.ts`. A write is allowed for:
  - a WorkOS user with the editor role (JWT checked in `convex/auth.config.ts`), or
  - an MCP OAuth token issued by AuthKit (second `customJwt` provider, issuer `https://$WORKOS_AUTHKIT_DOMAIN`), or
  - an MCP bearer token from `ALLOWED_MCP_TOKENS`, passed as `mcpToken`.
- Sign-up is open. Every WorkOS user may read the admin; writes need the token claim `headcode_role: "editor"` (WorkOS user metadata, copied by the environment's JWT template), otherwise `requireHeadcodeUser` throws a `ConvexError` asking for activation. The admin UI shows it via `errorMessage` (`_lib/use-actions.ts`), MCP as the tool error.
- Section data is stored as JSON strings. `convex/section_validations.ts` validates it against the field Zod validators: unknown keys are dropped, and invalid values fall back to defaults.
- The database is the only source of content. `convex/seed.ts` (`pnpm seed`, repeatable) fills it from `headcode/config.ts`: an empty install gets one shared version and sample entries, every run adds missing globals. Reads never fall back to config defaults.
- Content model, configured in `headcode/config.ts`:
  - **sections** (`headcode/sections.ts`) contain **fields** (`headcode/fields.ts`).
  - **entries** are either **globals** (a single entry per slug) or **collections** (repeatable entries).
  - image fields store `{ imageId }`.
- Versions are `live` and `draft`. Publishing promotes the draft to live and clones a new draft. `headcode/versions.ts` picks the version from the request host (`NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`), the same way for site, admin, and MCP.
- `proxy.ts` handles two things:
  - Site rewrites: every site URL goes to `/live/...` or `/draft/...` (`app/(site)/[version]`, root param read with `siteVersion()`), and `?md` / `Accept: text/markdown` go to `/[version]/headcode-markdown.txt/...`. Direct `/live` and `/draft` URLs return 404.
  - The AuthKit session. Unauthenticated `/admin/*` requests are sent to AuthKit, with the callback on the request host.
- `app/mcp/route.ts` is a stateless MCP server (`@modelcontextprotocol/server` v2, `legacy: 'reject'`). It checks Origin and the bearer token (`app/mcp/auth.ts`: AuthKit OAuth JWT with audience = `/mcp` URL of the request host, or a shared token). OAuth discovery is served by `app/.well-known/[...path]/route.ts`. MCP tools must keep parity with admin entry and section operations, and must never publish unless the user explicitly asks.
- The site renders HTML and Markdown from the same validated section data (`app/(site)/_sections`).
- Caching uses Next.js Cache Components (`cacheComponents`, `partialPrefetching`):
  - All site reads go through `cachedQuery` in `app/(site)/_lib/headcode.ts` (`'use cache'`, `cacheLife('hours')`, tag `headcode`). Pages and layouts are prerendered per version; blog and page entries come from `generateStaticParams`, new ones render on first visit (ISR).
  - Every write expires the tag: the admin via `revalidateSite` (`app/(admin)/_lib/revalidate.ts`, hooked into `ConvexReactClient.mutation`), MCP via `revalidateTag` in `app/mcp/route.ts`. Writes from elsewhere (Convex dashboard, scripts) show after at most one hour.
  - Do not read `headers()`, `cookies()` or uncached data in site pages; pass the version from `siteVersion()` into the cached helpers.

## Checks

```bash
pnpm test && pnpm lint && pnpm typecheck && pnpm build
pnpm mcp http://draft.localhost:3000/mcp headcode_get_version
pnpm parity http://draft.localhost:3000 --write
# in the monorepo root, after changing files listed in registry.json:
pnpm dlx shadcn@latest registry validate
```

- `scripts/parity.mts` is the contract every Headcode app keeps (MCP auth, tool list and annotations, site formats, edit-to-site cycle). Change it only together with the behavior, and note it in `CHANGELOG.md`.
- Before changing Next.js code, read `node_modules/next/dist/docs/`.
- Before changing Convex code, read `convex/_generated/ai/guidelines.md`.
- Admin sign-in uses the hosted AuthKit page. A human has to sign in once in the browser; after that, agents can reuse the session.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
