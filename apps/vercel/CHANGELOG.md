# Changelog (apps/vercel)

Core changes that variants based on `vercel` should follow.

## Unreleased

- `ListField({ label, description, fields })` in `headcode/fields.ts`: lists get a label and description in the admin (list title, breadcrumb) and in MCP. It is still an array (`[fields]`), so `[{ ... }]` keeps working. MCP `headcode_list_section_types` describes a list as `{ type: 'list', label, description, item }` instead of `[item]`.
- Registry install fixes (found by installing into a fresh `shadcn init` app):
  - `app/(site)/_sections/utils.tsx` is now `shared.tsx`. `shadcn add` rewrote every `@/lib/utils` and `@/headcode/utils` import to the first registry file named `utils`.
  - kibo `DialogStackNext`/`DialogStackPrevious` accept `render` (base-ui style) next to `asChild`, and the admin entries page uses `render`. `shadcn add` turns `asChild` into `render` on base-ui projects.
- `proxy.ts` matches every path except Next.js internals, `/mcp`, `/callback`, `/.well-known`, and files with an extension (plus `/llms.txt`), instead of a list of demo routes. `?md` works on every page; unknown paths return 404 Markdown instead of the homepage.
- `app/sitemap.ts` lists every global with a `path` (except files like `/llms.txt`) and every collection entry, instead of demo pages.
- Blog and page routes read `params` inside `<Suspense>`.
- `pnpm parity <url> --compare=<original-url>` compares every sitemap page with the original site: text, title, description, and screenshots at 1440px and 390px (< 0.1% pixels). Failed screenshots go to `.parity/compare/`.
- Strict writes: `validateSectionForStorage` rejects invalid values with a `ConvexError` (`Invalid hero section. data.title: ...`) instead of saving defaults. The admin shows the message, MCP returns it as the tool error. Reads still fall back to defaults. Formats (numbers, phone, ...) use a custom `validator` on a text field.
- MCP `headcode_list_section_types` returns the JSON Schema of every field (`schema`, from Zod), so agents can check data before they write.
- Admin theme is self-contained: `app/(admin)/admin.css` has its own copy of the shadcn theme and no longer imports `app/globals.css`. Sites can change their theme freely; the admin always looks the same. Needs `tw-animate-css` (now a registry dependency).
- Admin auth fix: the Convex token callback in `convex-client-provider.tsx` depends on `user.id` instead of the `user` object. Before, each WorkOS token refresh restarted Convex auth and the admin could hang on "Loading entries".
- `pnpm parity` checks the admin: without a session, `/admin` must redirect to AuthKit with this host's callback and `admin.css` must not import site CSS. `--login` saves a signed-in session in `.parity/` (gitignored); `--admin` then checks in headless Chrome that entries load and the stock theme is used, and with `--write` edits a field in the admin and checks the site. New devDependency `playwright-core` (uses the installed Chrome).
- The collection entry `index` is the collection root (`/docs`), see `entryPath`.
- Nested collection paths: an entry name with "/" (`install/vercel`) becomes `/<collection>/install/vercel`. `slugifyPath` in `headcode/utils.ts` slugifies each segment; `entryPath`, `getEntrySlug` and `db.getCollection` use it. Catch-all routes (`[...slug]`) render them.
- Collections can list `seed: [{ name, sections }]` in `headcode/config.ts`. An empty install gets these entries instead of one sample; `db.createEntry` takes optional sections.
- Content comes only from the database. `convex/seed.ts` (`pnpm seed`) creates the initial version, all globals and sample entries; the site no longer renders runtime defaults.
- Removed `ensureGlobal` and the MCP tool `headcode_ensure_global`; globals exist after seeding.
- `vercel.json` builds with `pnpm convex deploy && pnpm seed && pnpm build` (`convex deploy --cmd` runs the build before the functions are pushed).
- Empty collections return `[{ slug: '-' }]` from `generateStaticParams` (Cache Components needs one param).
- SEO: `app/(site)/_lib/seo.tsx` (`pageMetadata`, `firstImage`, `JsonLd`) gives every page a canonical URL, Open Graph and Twitter card (first page image as preview). Home has `WebSite`, blog posts `BlogPosting` JSON-LD. Draft hosts get `noindex` and `robots.txt` `Disallow: /` (`app/robots.ts`). Parity checks both.
- Agents can see the site structure: `headcode_list_entries` returns `contentTypes` (kind, path, purpose, allowed sections) and `path`/`description` per entry; `headcode_list_section_types` also accepts a collection slug alone. Global configs may set `path` in `headcode/config.ts`. Section descriptions now say what each section is for (shown in the admin too).
- `pnpm parity [url] [--write]` (`scripts/parity.mts`): contract tests for MCP auth, tools, site formats and the edit-to-site cycle. Variants copy the script and must pass it.
- Admin header: text navigation Content / Images / Versions, "View site", account menu (email, theme, sign out); on mobile everything is in one menu. The version badge is no longer a link.

## 2.0.0-alpha.0

- Moved into the monorepo as the reference app.
