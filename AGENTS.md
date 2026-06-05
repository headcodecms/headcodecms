# Headcode CMS Agent Guide

Headcode CMS is a Next.js CMS built for agent-assisted editing. It has a public site, an admin UI, and an MCP server backed by Convex.

Keep this file short and operational. Put durable architecture notes in `ARCHITECTURE.md`.

## Core Rules

- Use only the existing stack: Next.js App Router, React, TypeScript, Convex, Convex Auth, shadcn/ui, kibo-ui, Tailwind CSS, Zod, Vitest, and pnpm.
- Do not add dependencies or replace project technology without asking first.
- Make the smallest change that solves the request. Avoid speculative abstractions and unrelated cleanup.
- Touch only the files required for the task. Preserve user changes.
- Use arrow function syntax where reasonable.
- Do not write application code in root `/lib` or `/components`; those are reserved for shadcn/ui and kibo-ui code.
- Surface uncertainty and tradeoffs. Do not guess when local files or docs can answer the question.
- Work on main branch. Re-create PR's in main, don't merge.
- Reuse shared Convex validators from `convex/schema_validators.ts`; do not duplicate schema, service arg, and DB helper shapes.
- Keep section data validation in `convex/section_validations.ts`; store section data as JSON strings and return parsed validated data from services.
- Pass content versions through services as `version: 'live' | 'draft'`; do not expose new `live: boolean` service arguments.
- Keep public site CMS fetching simple: Server Components should use Convex service queries and rely on Convex function caching before adding Next.js cache/revalidation layers.

## Required Reading

- Read `ARCHITECTURE.md` before changing cross-cutting CMS behavior, content modeling, publishing, registry output, or more than one app area.
- Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. This project may use newer APIs than your training data.
- Before changing Convex code, read `convex/_generated/ai/guidelines.md`.

## Project Map

- `convex/`: core services, schema, validation, storage, and database access.
- `convex/services.ts`: service boundary used by site, admin, and MCP. Clients must not call database helpers directly.
- `convex/authorization.ts`: default auth extension point. Keep it simple by default; extend it for project-specific users, organizations, permissions, metadata, or user-table checks.
- `convex/schema_validators.ts`: shared Convex `v.*` validators and inferred input types for schema, service args, and DB helpers.
- `convex/section_validations.ts`: validates section data from `headcodeConfig` and field Zod validators.
- `convex/db/`: internal Convex database helpers.
- `headcode/config.ts`: main CMS configuration.
- `headcode/sections.ts`: section definitions.
- `headcode/defaults.ts`: default section data.
- `headcode/fields.ts`: field definitions.
- `headcode/types.ts`: shared inferred types.
- `app/(site)/`: public site code.
- `app/(site)/_components/`: site components.
- `app/(site)/_sections/`: public site section renderers. Keep each section's HTML and Markdown rendering together here.
- `app/(site)/**/md.ts`: page-specific public Markdown renderers. Keep them close to the matching `page.tsx`.
- `app/(site)/_lib/`: site utilities.
- `app/(site)/site.css`: site-only custom CSS.
- `app/(admin)/`: admin UI code.
- `app/(admin)/_fields/`: admin field components and field mapping.
- `app/(admin)/_components/`: admin components.
- `app/(admin)/_lib/`: admin utilities.
- `app/(admin)/admin.css`: admin-only custom CSS.
- `app/globals.css`: global shadcn/ui styles only.
- `registry.json`: shadcn registry source for distribution.

## Commands

- Package manager: `pnpm`.
- Do not run the dev server. It is already available at `https://headcode.localhost`.
- Do not run `pnpm convex dev`. Convex is already available.
- Run focused tests with `pnpm test:once`.
- Run the watch test runner with `pnpm test` only when explicitly useful.
- Run `pnpm lint` after TypeScript, React, or config changes.
- Run `pnpm dlx shadcn@latest registry validate` after changing files included in the shadcn registry.
- Run `pnpm outdated` and update dependencies to latest version when I ask.

## Testing

- Test Convex services, database helpers, and section data validation with Vitest.
- Ensure section data remains valid JSON and covers edge cases.
- Do not add unrelated UI snapshot or end-to-end test infrastructure.
- After UI changes, verify in the browser at `https://headcode.localhost`.
- Convex Auth admin access uses Resend magic links by default. Configure `AUTH_RESEND_KEY`, optional `AUTH_RESEND_FROM`, and `ALLOWED_ADMIN_EMAILS` in Convex environment variables.
- Browser agents can use `/admin/login?test=true` in development only when `NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true`, `NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN` is set, server-side `HEADCODE_ENABLE_TEST_LOGIN=true`, `HEADCODE_ADMIN_TEST_TOKEN` matches, and `HEADCODE_ADMIN_TEST_EMAIL` is in `ALLOWED_ADMIN_EMAILS`. Do not configure server-side test-login variables in production.
- Define success criteria for non-trivial work, then loop until verified or clearly blocked.

## MCP Setup Checks

- MCP bearer-token access is controlled by `ALLOWED_MCP_TOKENS` in Convex and Next.js environment variables.
- OpenCode MCP config lives in `~/.config/opencode/opencode.json`; use distinct server names such as `headcode-live` and `headcode-draft`, and configure remote server `headers.Authorization` with the bearer token.
- Convex Auth requires `JWT_PRIVATE_KEY`, `JWKS`, and usually `SITE_URL` in Convex environment variables. Magic links require `AUTH_RESEND_KEY`.
- Verify OpenCode bearer-token MCP with `opencode mcp list` and `opencode run 'Use the headcode-live MCP server. Call the headcode_get_version tool and print only the JSON result.'`.
- MCP version routing follows the request host. Live and draft MCP clients should point to different hosts, not different service args.
- MCP content-editing tools should stay in parity with admin entry and section operations. Normal MCP edits must not publish unless the user explicitly asks.
- MCP image uploads should prefer `headcode_upload_image_from_url`; it validates the image, generates metadata and blur data server-side, stores the asset in Convex, and returns `{ imageId }` for section updates.
- If an MCP client must upload a local binary file, call `headcode_create_image_upload_url`, upload the file with HTTP `POST` to the returned URL, then call `headcode_register_uploaded_image` with the returned `storageId`.

## Distribution

- Headcode CMS is distributed through the shadcn GitHub registry.
- Keep `registry.json` in sync with core, site, admin, and MCP resources.
- Include shadcn/ui and kibo-ui as `registryDependencies`.
- Include required library dependencies in the registry definition.

## Content Model

- A page is composed from ordered sections.
- Fields are the editable data inside sections.
- Entries combine sections into globals or collections.
- Globals are singleton entries identified by slug.
- Collections are repeatable entry types such as pages or blog posts.
- Images are uploaded to Convex; CMS data stores the reference and metadata.
- Image fields in section JSON store `{ imageId }` references. Image metadata, dimensions, storage ids, and blur placeholders live in the `images` table.
- Versions are `draft` and `live`. Publishing promotes the current draft to live and creates a new draft from it.
- Site/admin/MCP version selection is configured with `NEXT_PUBLIC_HEADCODE_VERSION=live|draft|auto`; `auto` uses `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS` to route draft hosts, and defaults to live when unset.
- CMS collection routes should fetch by slug at request time. Do not use `generateStaticParams` for CMS-created pages or posts unless static rendering is an intentional later optimization.
- Public site Markdown output should be rendered directly from validated section data, not converted from rendered HTML. `?md` and `Accept: text/markdown` should use the same route dispatcher, which calls page-local `md.ts` renderers.
- `/llms.txt` is backed by the `llms` global and `llms-txt` richtext section; it returns the validated Markdown content directly.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
