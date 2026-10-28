# Changelog (apps/workos)

Core changes that variants based on `workos` should follow.

## Unreleased

- Content comes only from the database. `convex/seed.ts` (`pnpm seed`) creates the initial version, all globals and sample entries; the site no longer renders runtime defaults.
- Removed `ensureGlobal` and the MCP tool `headcode_ensure_global`; globals exist after seeding.
- Empty collections return `[{ slug: '-' }]` from `generateStaticParams` (Cache Components needs one param).

## 2.0.0-alpha.0

- Moved into the monorepo as the reference app.
