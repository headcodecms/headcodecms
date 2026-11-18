# Headcode CMS monorepo – Agent Guide

Version 3, in development on the `v3` branch. Turborepo with apps in `apps/*`. Version 2 is the `2.1.0` tag.

- `apps/backend`: Rust crate `headcode` (axum, rmcp, sqlx). One router for `headcode serve` and the Vercel Function (`api/mcp.rs`). Migrations in `migrations/`.
- `apps/auth`: Next.js with Better Auth, the OAuth 2.1 server for MCP clients, shared by all sites.
- Site apps (`base`, then `www`, `blog`, `docs`, `shopify`) are named by purpose, without prefixes.

## Rules

- Prefer the simplest solution; avoid complexity.
- Each app keeps its own `package.json`, lockfile and `pnpm-workspace.yaml`, so it can be copied out. Shared code may move to `packages/` once a second user needs it.
- The backend identifies callers by the token's `iss` and `sub`, checks its audience (the project's MCP URL), and reads roles from its own database (project members), never from the token.
- `node apps/backend/scripts/smoke.mjs [mcp-url]` must pass, locally and after each deploy.
- The root only holds Turborepo, the workspace list and docs. Ask before you add anything else to the root.

## Rust (`apps/backend`)

- Plain functions and structs. Add a trait or generic only when a second implementation exists.
- Keep code in one file until it hurts; split when a part stands on its own.
- `anyhow` for errors; a custom error type only where the caller must tell cases apart.
- SQL lives inline next to its use, no repository layer. Pass transactions as `&mut PgConnection`.
- No `unwrap()` or `expect()` on the request path.
- Add a dependency only with a reason.
- Before a commit: `cargo fmt`, `pnpm lint`, `pnpm test`, and the smoke test.

## Commands

```bash
pnpm install
pnpm dev                 # backend :3080 (embedded Postgres), auth :3081
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
