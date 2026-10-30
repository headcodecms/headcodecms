# Changelog (apps/workos)

Core changes that variants based on `workos` should follow.

## Unreleased

- Content comes only from the database. `convex/seed.ts` (`pnpm seed`) creates the initial version, all globals and sample entries; the site no longer renders runtime defaults.
- Removed `ensureGlobal` and the MCP tool `headcode_ensure_global`; globals exist after seeding.
- `vercel.json` builds with `pnpm convex deploy && pnpm seed && pnpm build` (`convex deploy --cmd` runs the build before the functions are pushed).
- Empty collections return `[{ slug: '-' }]` from `generateStaticParams` (Cache Components needs one param).
- Agents can see the site structure: `headcode_list_entries` returns `contentTypes` (kind, path, purpose, allowed sections) and `path`/`description` per entry; `headcode_list_section_types` also accepts a collection slug alone. Global configs may set `path` in `headcode/config.ts`. Section descriptions now say what each section is for (shown in the admin too).
- `pnpm parity [url] [--write]` (`scripts/parity.mts`): contract tests for MCP auth, tools, site formats and the edit-to-site cycle. Variants copy the script and must pass it.
- Admin header: text navigation Content / Images / Versions, "View site", account menu (email, theme, sign out); on mobile everything is in one menu. The version badge is no longer a link.

## 2.0.0-alpha.0

- Moved into the monorepo as the reference app.
