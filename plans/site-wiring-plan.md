# Site Wiring Plan

## Goal

Transfer the public site prototype from `/Users/markus.tripp/Documents/next/test-ui` into this app so the rendered site matches the prototype exactly, except blog read time is removed. The site should render from Headcode defaults through the same service-layer shape that Convex services return.

Do not run the dev server. It is already available at `https://headcode.localhost`.

## Source Prototype

Prototype routes to transfer:

- `/` from `test-ui/app/(site)/page.tsx`
- `/blog` from `test-ui/app/(site)/blog/page.tsx`
- `/blog/[slug]` from `test-ui/app/(site)/blog/[slug]/page.tsx`
- `/docs` from `test-ui/app/(site)/docs/page.tsx`
- `/pages/[slug]` from `test-ui/app/(site)/pages/[slug]/page.tsx`
- `/pricing` from `test-ui/app/(site)/pricing/page.tsx`
- Site layout from `test-ui/app/(site)/layout.tsx`
- Supporting site components from `test-ui/components/site/*`
- Supporting public site libs from `test-ui/lib/blog.tsx`, `test-ui/lib/pages.tsx`, and `test-ui/lib/entries.ts`

Current app files to replace or add under the project structure:

- `app/(site)/layout.tsx`
- `app/(site)/page.tsx`
- `app/(site)/blog/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/blog/post-list.tsx`
- `app/(site)/docs/page.tsx`
- `app/(site)/pages/[slug]/page.tsx`
- `app/(site)/pricing/page.tsx`
- `app/(site)/_components/*`
- `app/(site)/_lib/*`

Use project architecture paths, not prototype root paths: site components belong in `app/(site)/_components`, and site utilities belong in `app/(site)/_lib`.

## shadcn/ui And Dependencies

Install current shadcn/ui components from `@shadcn`; do not copy `components/ui/*` from the prototype.

Likely shadcn/ui components needed for the public site:

- `button` is already present.
- `card`
- `sheet`
- `tabs`
- `select`
- `dialog`
- `item`
- `navigation-menu`

Prototype public site also uses kibo-style helpers:

- Code block display
- Install snippet tabs
- Typography/prose rendering

Implementation approach:

- Prefer existing stack and registry components.
- If a kibo-ui registry item is available and needed, install it through the proper registry/CLI instead of copying prototype generated files.
- If a kibo component is not available from the configured registry, create a small site-local component in `app/(site)/_components` that preserves the prototype output and uses installed shadcn/ui primitives.
- Do not add new non-shadcn dependencies unless the site component cannot work without them and we ask first.

## Data Strategy

First pass should not depend on live Convex reads for visual parity. It should render from `headcodeConfig` defaults, then expose the same data shape as the service layer.

Add a site utility layer in `app/(site)/_lib` that:

- Reads `headcodeConfig.globals` and `headcodeConfig.collections`.
- Builds service-shaped entries with `_id`, `_creationTime`, `slug`, `name`, `modificationTime`, and `version`.
- Builds service-shaped sections with `_id`, `_creationTime`, `name`, `pos`, `entry`, and parsed validated `data`.
- Uses `convex/section_validations.ts` to validate default section data before rendering.
- Uses the existing `ServiceEntry` and `ServiceSection` types from `headcode/types.ts`.

This gives the site renderer the same shape it will later receive from:

- `getGlobal`
- `getGlobalSections`
- `getCollections`
- `getCollectionSections`

Later, replacing defaults with Convex service calls should be a data-source swap, not a component rewrite.

## Section Renderer

Create a section renderer that maps section `name` to the transferred prototype UI:

- `meta`: consumed by metadata helpers, not rendered as a visual section.
- `header`: feeds `SiteHeader`.
- `footer`: feeds `SiteFooter`.
- `hero`: renders prototype hero.
- `logos`: renders prototype logo list.
- `image-text`: renders prototype image-with-text feature rows.
- `image`: renders prototype standalone image/fallback icon section.
- `text`: renders prototype prose/rich text section.
- `plans`: renders pricing cards.
- `snippet`: renders install snippet tabs.
- `code`: renders code block tabs.
- `blog-meta`: feeds blog listing/detail metadata.

Remove read time from all blog UI and data mapping.

## Future Markdown Output

Add Markdown rendering for public site entries after the HTML site and admin editor are stable.

Desired behavior:

- Render a Markdown version of CMS pages when `?md` is added to a site URL.
- Render Markdown automatically when the request is clearly from an agent and the request accepts a Markdown response.
- Use the same validated service-shaped entry and section data as the HTML renderer.
- Keep section-specific Markdown output close to section-specific HTML output so behavior stays aligned.

Recommended structure:

- Split large site section rendering into section modules once the section set grows, for example one module per section containing both HTML and Markdown rendering.
- Keep shared data extraction and type narrowing in one place so `hero` HTML and `hero` Markdown cannot drift.
- Start with simple text output for presentational sections such as hero, text, image-text, plans, snippet, and code.
- Do not convert arbitrary React output to Markdown after rendering; render Markdown directly from section data.

This should be a later site feature, not part of the current admin field-renderer step.

## Route Mapping

Use defaults from config for the first transfer:

- `/`: global `home`
- `/pricing`: global `pricing`
- `/docs`: global `docs`
- `/blog`: collection `blog` listing from default collection entries or one seeded default until real entries exist
- `/blog/[slug]`: collection `blog`
- `/pages/[slug]`: collection `pages`

If config defaults only define one default blog/page entry, keep the prototype layout but use the default values for content. Do not invent extra content unless required for visual parity; if prototype lists need multiple cards, derive lightweight preview entries from available defaults or preserve static prototype demo entries only in a clearly named site-local fallback.

## Metadata

Use Next.js App Router conventions from local Next 16 docs:

- `params` is a `Promise` in dynamic route pages.
- Route metadata should be generated from `meta` or `blog-meta` section data.
- For blog, `blog-meta` now includes base meta fields, so do not expect a separate `meta` section.

## Visual Transfer Rules

- Match prototype markup, spacing, class names, component composition, and behavior as closely as possible.
- Remove blog read time only.
- Keep public site components as Server Components unless they need interactivity.
- Client components are allowed for tabs, sheets/dialogs, and code/snippet UI where the installed shadcn primitive requires it.
- Use lucide icons from `lucide-react`, matching prototype icon choices.
- Use `app/(site)/site.css` for site-only custom CSS. Keep `app/globals.css` limited to shadcn/global styles.
- Do not create a landing page wrapper or marketing redesign; the homepage is the usable prototype experience.

## Implementation Steps

1. [x] Install required current shadcn/ui components.
   - Use `pnpm dlx shadcn@latest add ...`.
   - Do not copy prototype `components/ui/*`.
   - Review generated files after install.

2. [x] Copy/adapt site-only components.
   - Transfer prototype site components into `app/(site)/_components`.
   - Update imports from `@/components/site/*` to `app/(site)/_components` relative or alias-safe imports.
   - Keep `Container` site-local, not root `components`.

3. [x] Build the default data adapter.
   - Add site-local utilities in `app/(site)/_lib`.
   - Convert `headcodeConfig` defaults into service-shaped entries/sections.
   - Validate default section data through `validateSectionForStorage`/`validateSection` or equivalent.

4. [x] Implement section rendering.
   - Map validated service sections to prototype UI components.
   - Add narrow data types for each section with safe parsing/casts at the renderer boundary.

5. [x] Transfer routes.
   - Add/replace public route files.
   - Wire each page to default data adapter and section renderer.
   - Remove read time from blog listing and blog detail.

6. [x] Update sitemap after routes are real.
   - Restore `app/sitemap.ts` usage of `getSitemapUrl` and `getSitemapUrls` once collection entry helpers return service-shaped entries.

7. [x] Verify.
   - Run `pnpm test:once`.
   - Run `pnpm exec tsc --noEmit`.
   - Run `pnpm lint`.
   - Verify in browser at `https://headcode.localhost`.
   - Compare visually against `http://localhost:3000`.

Note: `https://headcode.localhost` returned a Portless 502 during implementation, so browser verification is blocked until the existing local server is reachable again. Static verification completed with `pnpm test:once`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm registry:build`, and `pnpm build`.

## Open Risks

- Prototype may rely on dependencies not currently installed, especially code highlighting or rich text rendering. Ask before adding non-shadcn dependencies.
- Current defaults may not contain enough collection entries to reproduce every prototype list exactly. Preserve exact layout first, then decide whether demo defaults need expanding.
- Convex service calls from Next server components may need a client setup decision later. This step should avoid blocking on that by using config defaults through the service-shaped adapter.
