# Headcode CMS Context Dump

This file preserves the implementation context from the `headcode2` development
thread so a new Codex project opened at this repository can continue without
starting cold.

## Repository Migration

- The previous `headcodecms/headcodecms` monorepo implementation is preserved on
  tags `1.0.0`, `1.0.1`, `1.0.2`, and `legacy-1.x`.
- This branch, `codex/headcode2-replacement`, replaces that monorepo with the
  single Next.js/Convex implementation developed in
  `/Users/markus.tripp/Documents/next/headcode2`.
- The final install target is the shadcn GitHub registry item
  `headcodecms/headcodecms/headcode`.
- The old generated `public/r/*` registry assets are intentionally gone.
  shadcn reads root `registry.json` directly from GitHub.

## Current Architecture

- Next.js App Router with route groups:
  - `app/(site)` public site
  - `app/(admin)` admin UI
  - `app/(mcp)` MCP transport
- Convex is the service layer and database.
- Convex Auth with Resend magic links is the default admin auth.
- Public site is open; admin and MCP are protected.
- Content versions are `live` and `draft`; routing uses
  `NEXT_PUBLIC_HEADCODE_VERSION=live|draft|auto` and
  `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`.
- If no draft/live configuration is set, the simplest local install serves the
  default live version and the initial internal version can be both live and
  draft.
- Section data is stored in Convex as JSON strings and validated through
  `convex/section_validations.ts` from the Headcode field configuration.
- Images are stored in Convex Storage and referenced in section JSON as
  `{ imageId }`; image metadata, dimensions, storage id, and blur data live in
  the `images` table.

## Important Files

- `AGENTS.md`: operational rules for future agents.
- `ARCHITECTURE.md`: durable architecture notes.
- `docs/installation.md`: human and agent installation guide.
- `docs/release-checklist.md`: manual `headcode doctor` checklist and release gates.
- `registry.json`: shadcn GitHub registry item definition.
- `convex/services.ts`: public service boundary for site/admin/MCP.
- `convex/schema_validators.ts`: shared Convex validators and inferred input
  types.
- `convex/section_validations.ts`: config-derived Zod section data validation.
- `headcode/config.ts`: CMS entry point.
- `headcode/sections.ts`: section and field definitions.
- `headcode/defaults.ts`: default content used when Convex has no CMS data.
- `app/(site)/_sections`: section renderers; keep HTML and Markdown renderers
  together.
- `app/(admin)/_fields`: dynamic admin field renderers.
- `app/(admin)/admin/images/page.tsx`: image gallery.
- `app/(mcp)/[transport]/route.ts`: MCP server and tool definitions.

## Installation Flow

Agents should ask setup questions before running Convex/Auth commands:

1. Does the target directory already contain a Next.js/shadcn app?
2. Use standard site design or adapt an existing design?
3. Which Convex project should this app connect to?
4. Which local URL should auth use as `SITE_URL`?
5. Which admin emails are allowed?
6. Which Resend sender and API key should magic links use?
7. Enable development test login?
8. Configure MCP bearer tokens now?

Canonical install command:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

Timing matters:

1. Install registry files.
2. Run `pnpm convex dev` so `.env.local`, `CONVEX_DEPLOYMENT`, and
   `convex/_generated` exist.
3. Run `pnpm dlx @convex-dev/auth`.
4. Set Convex env variables.
5. Run `pnpm auth:token` only when enabling dev test login or MCP tokens.

## Verification

Use these checks before pushing release branches:

```bash
pnpm test:once
pnpm lint
pnpm dlx shadcn@latest registry validate
pnpm build
```

For this migration branch, also verify:

```bash
pnpm exec tsc --noEmit --pretty false
```

## Alpha Priorities

- Run one empty-project install test from the GitHub registry.
- Run one existing-design install test from the GitHub registry.
- Continue admin polish only after install flow is stable.
- Keep MCP tools explicit: normal content edits must not publish unless the user
  explicitly asks to publish.
- Keep the core simple: service layer, configuration, section validation, site
  defaults, admin UI, and MCP parity.

## Notes For Future Codex Sessions

- Work on branches; do not merge this replacement into `main` until the planned
  testing phase is complete.
- The old repo state is already protected by tags, so do not rewrite history.
- Do not copy local `.env*`, `.next`, or `node_modules` from development
  workspaces.
- If adapting a vibe-coded site, use its design as the public `app/(site)` and
  map editable content into `headcode/sections.ts`, `headcode/defaults.ts`, and
  `headcode/config.ts`.
