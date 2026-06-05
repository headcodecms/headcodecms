# Headcode CMS Architecture

Headcode CMS is a simple web CMS for Next.js. It includes:

- A public site that renders CMS entries as HTML and Markdown.
- An admin UI for humans to edit entry and section content.
- An MCP server so AI chat clients can update website content through tools.
- Agent-friendly site output including `llms.txt`, `sitemap.xml`, and Markdown page versions.

## Domain Model

Sections are reusable page blocks such as header, hero, features, text image, footer, and plans. Each section exposes editable fields, such as hero title, subtitle, and image.

Entries combine ordered sections into renderable content. A global is a singleton entry shared across the site, such as a header or footer, and is identified by slug. A collection contains multiple entries with the same structure, such as pages or blog posts.

Images are uploaded to Convex file storage. CMS section content stores image field references as `{ imageId }`; the `images` table owns storage ids, public URLs, dimensions, file metadata, alt text, and blur placeholders.

Headcode supports two content versions: `draft` and `live`. The active version is configured with `NEXT_PUBLIC_HEADCODE_VERSION`, using `live`, `draft`, or `auto`. In `auto` mode, hosts listed in `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS` serve and edit draft content; all other hosts use live content. Site, admin, and MCP requests all use this same host-based resolver, so `draft.example.com/mcp` edits draft while `www.example.com/mcp` edits live. MCP clients should model this as separate named servers, for example `headcode-draft` and `headcode-live`, each pointing at the matching host. If nothing is configured, Headcode uses `live`, and the initial internal version can be both live and draft. Publishing promotes the current draft to live, then creates a new draft from the published version.

## Boundaries

All site, admin, and MCP access should go through `convex/services.ts`. Keep direct database access inside `convex/db/`. Public service methods use `version: 'live' | 'draft'` rather than boolean version flags.

Configuration is shared across site, admin, MCP, and Convex services:

- `headcode/config.ts` connects fields, sections, globals, and collections.
- `headcode/sections.ts` defines available sections.
- `headcode/defaults.ts` defines valid default section data.
- `headcode/fields.ts` defines available field configurations.
- `headcode/types.ts` contains shared inferred types.

Validation has two layers:

- `convex/schema_validators.ts` defines shared Convex `v.*` validators for schema fields, service arguments, and inferred DB helper input types.
- `convex/section_validations.ts` validates section data from `headcodeConfig` and field Zod validators.

Convex stores section data as JSON strings. Service reads return parsed, validated section data for site, admin, and MCP consumers. Reads do not initialize or mutate version data; mutation and bootstrap paths use an explicit initial version ensure step.

Authorization is intentionally simple by default. Headcode uses Convex Auth for the admin UI with Resend email magic links and an `ALLOWED_ADMIN_EMAILS` allow-list stored in Convex environment variables. Public sign-up is not open: a user can only create or use an account when the email is present in the allow-list. Resend is configured with `AUTH_RESEND_KEY` and optional `AUTH_RESEND_FROM`. The admin route is protected in `proxy.ts` with Convex Auth's Next.js middleware.

Browser-based agent testing uses the normal `/admin/login` page. In development, `/admin/login?test=true` or the visible Test login button can call the `test-token` Convex Auth provider and create a normal Convex Auth admin session without email delivery. The client helper only appears when `NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true` and `NODE_ENV=development`. The server provider requires `HEADCODE_ENABLE_TEST_LOGIN=true`, a matching `HEADCODE_ADMIN_TEST_TOKEN`, and `HEADCODE_ADMIN_TEST_EMAIL` in `ALLOWED_ADMIN_EMAILS`; do not configure those server-side test-login variables in production.

MCP authentication uses shared bearer tokens from `ALLOWED_MCP_TOKENS` in Convex and Next.js environment variables. The Next.js MCP route validates the bearer token before executing tools, then passes the same token through the narrow optional `mcpToken` service argument for protected Convex service calls. Browser/admin writes still use the Convex Auth session. Keep this token path limited to MCP tools and avoid broad unauthenticated service bypasses.

MCP image uploads are handled by the Next.js Node runtime, not Convex. URL-based uploads fetch the source image, enforce the configured Headcode defaults, generate dimensions and ThumbHash blur data with `sharp` and `thumbhash`, upload the file to Convex storage, then create an `images` record. MCP tools return `{ imageId }` so agents can update section image fields without embedding image metadata into section JSON.

Projects that need stricter rules should extend `convex/authorization.ts`, not the individual service functions. Good extension points include a project-owned users table, organizations, custom permissions, domain checks, or per-project token tables. Keep `convex/services.ts` calling semantic helpers such as `requireHeadcodeWrite`, `requireHeadcodePublish`, and `requireHeadcodeMcp` so the service boundary stays stable.

Projects can replace Convex Auth with another provider such as Clerk if they need hosted organizations, SSO policy management, or provider-specific admin workflows. Keep that as a project-specific integration rather than the Headcode default, because auth provider setup and MCP guidance change over time.

Site code lives under `app/(site)`:

- `app/(site)/_components` for site UI components.
- `app/(site)/_lib` for site utilities.
- `app/(site)/site.css` for site-only custom CSS.

Public site data fetching should start with the simplest model: Server Components call Convex service queries, and Convex query caching is the primary cache. Avoid adding Next.js `use cache`, tag revalidation, ISR, or static parameter generation for CMS content until performance data shows a need. Collection routes such as pages and blog posts should fetch by slug at request time so newly published content works without a rebuild.

Admin code lives under `app/(admin)`:

- `app/(admin)/_fields` for field components and field mapping.
- `app/(admin)/_components` for admin UI components.
- `app/(admin)/_lib` for admin utilities.
- `app/(admin)/admin.css` for admin-only custom CSS.

Root `app/globals.css` is only for global shadcn/ui styles. Root `/components` and `/lib` are reserved for shadcn/ui and kibo-ui library code. Do not customize generated shadcn/ui or kibo-ui files for app-specific behavior; compose or copy them into `app/(admin)/_components` or `app/(site)/_components` and keep the local differences there.

Public site section rendering lives under `app/(site)/_sections`. Each section module should keep its HTML renderer and Markdown renderer together so agent-readable output cannot drift from the visible site. The central `_sections/index.tsx` maps service section names to renderers and provides shared entry Markdown rendering. Page-specific Markdown composition lives in `app/(site)/**/md.ts` beside the matching `page.tsx`; `app/headcode-markdown.txt/[[...path]]/route.ts` only dispatches to those renderers and sets the `text/markdown` response. Markdown output should be rendered from validated section data, not scraped or converted from React output. Public pages expose Markdown through `?md` and explicit `Accept: text/markdown` negotiation.

`/llms.txt` is an editable CMS-backed route. It reads the `llms` global, renders the `llms-txt` richtext section as Markdown, and falls back through the normal Headcode default-data path on empty installs. Keep the content concise and focused on public and agent-action links.

## Distribution

The project can be installed through the shadcn GitHub registry as `headcodecms/headcodecms/headcode`. Root `registry.json` must include all required resources from core, site, admin, and MCP. Registry dependencies should include shadcn/ui and kibo-ui components, plus any required library dependencies. No generated `public/r/*` registry assets are required.
