# Headcode CMS

Headcode CMS is an open-source CMS for Next.js websites that should be editable
by both people and agents.

It installs into your codebase through the shadcn registry and gives you a
public site, admin UI, structured content, draft/live publishing, Markdown
output, `llms.txt`, Convex-backed storage, and an MCP server for authorized AI
clients.

> The next website is not only a page. It is a source of truth for people,
> search engines, chat clients, and agents.

Headcode is built for small and medium websites: client sites, studios,
agencies, product pages, blogs, docs, local businesses, and projects that need
structured content without enterprise CMS weight.

## Features

- **Next.js App Router** public site and admin UI.
- **Convex** database, services, storage, and function caching.
- **Convex Auth** with Resend magic-link admin login.
- **shadcn/ui**, **kibo-ui**, Tailwind CSS, TipTap, Zod, and TypeScript.
- **Fields, sections, globals, and collections** for typed content modeling.
- **Draft/live publishing** with version history and restore support.
- **Convex Storage image library** with metadata, dimensions, and blur data.
- **Markdown output** for agent-readable versions of public pages.
- **Editable `/llms.txt`** backed by CMS content.
- **MCP server** for authorized AI clients and coding agents.
- **shadcn registry distribution** so the CMS lives in your app, not behind a
  hosted black box.

## Status

Headcode CMS is in active development. Version `0.2.0` is the first public
release of the new Next.js and Convex implementation. Use it if you are
comfortable with early open-source software and want a CMS that is easy to
inspect, fork, and customize.

## Automatic Installation

Headcode is designed to be installed with a coding agent. Copy this prompt into
Codex, Claude Code, OpenCode, Cursor, or another local coding agent:

```text
Read https://headcodecms.com/start.md then install Headcode CMS in this directory.
```

The agent should inspect your project, ask for the missing Convex/Auth/Resend
values, install the shadcn registry item, and guide you through verification.

## Manual Installation

Use the manual path when you prefer to run each command yourself. Install
Headcode from the shadcn GitHub registry:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

For a new empty project, initialize a shadcn/ui Next.js app first:

```bash
pnpm dlx shadcn@latest init --preset bbVJxYW --base base --template next --pointer
```

If you are installing into a fresh starter, remove the starter root route files
before adding Headcode:

```bash
rm -f app/page.tsx app/layout.tsx
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
pnpm install
pnpm convex dev
```

After `pnpm convex dev` creates `.env.local` and `CONVEX_DEPLOYMENT`, run
Convex Auth setup:

```bash
pnpm dlx @convex-dev/auth
```

Set the minimum Convex environment variables:

```bash
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com"
pnpm convex env set AUTH_RESEND_KEY "re_..."
pnpm convex env set AUTH_RESEND_FROM "Headcode <admin@example.com>"
pnpm convex env set SITE_URL "http://localhost:3000"
```

Start the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin/login
```

For the full setup, including Resend, draft hosts, development test login, MCP
tokens, and production notes, read [docs/installation.md](docs/installation.md).

Do not put server secrets into `NEXT_PUBLIC_*` variables, and do not commit real
`.env.local` values.

## Architecture

Headcode has three app surfaces:

| Surface     | Path          | Purpose                                                            |
| ----------- | ------------- | ------------------------------------------------------------------ |
| Public site | `app/(site)`  | HTML pages, Markdown rendering, sitemap, `llms.txt`.               |
| Admin UI    | `app/(admin)` | Authenticated editing for entries, sections, images, and versions. |
| MCP server  | `app/(mcp)`   | Bearer-token-protected tools for AI clients.                       |

Convex is the service layer and database. Site, admin, and MCP code should call
the service boundary in `convex/services.ts`.

Important files:

| Path                             | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `headcode/config.ts`             | Globals, collections, section choices, defaults. |
| `headcode/sections.ts`           | Section definitions and editable fields.         |
| `headcode/defaults.ts`           | Default content for empty installs.              |
| `headcode/versions.ts`           | Host-based live/draft resolver.                  |
| `convex/services.ts`             | Shared service boundary.                         |
| `convex/schema_validators.ts`    | Shared Convex validators.                        |
| `convex/section_validations.ts`  | Section data validation.                         |
| `app/(site)/_sections`           | Public HTML and Markdown section renderers.      |
| `app/(admin)/_fields`            | Admin field components.                          |
| `app/(mcp)/[transport]/route.ts` | MCP server and tools.                            |
| `registry.json`                  | shadcn registry definition.                      |

Read [ARCHITECTURE.md](ARCHITECTURE.md) for the durable architecture notes.

## Content Model

Headcode content is made from:

- **Sections**: reusable blocks such as hero, text, image, plans, and footer.
- **Fields**: editable values inside sections.
- **Entries**: ordered section groups.
- **Globals**: singleton entries like header, footer, home, docs, or `llms.txt`.
- **Collections**: repeatable entry types like blog posts and pages.
- **Images**: Convex Storage assets referenced from section JSON.
- **Versions**: `draft` and `live`.

Section data is stored as JSON strings in Convex and returned through services
as parsed, validated data.

## Draft, Live, And Agents

Headcode supports `live` and `draft` content versions. Publishing promotes the
current draft to live and creates a new draft from it. Draft/live routing can be
host-based:

```env
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.example.com,preview.example.com
```

Public content is available as designed HTML for humans and Markdown for
agents. Useful agent-facing routes include:

```text
/llms.txt
/headcode-markdown.txt/
/headcode-markdown.txt/blog
/headcode-markdown.txt/pricing
```

The MCP server lets authorized clients inspect and edit CMS content. Normal MCP
edits do not publish; publishing is intentionally a separate release action.

## Local Development And Contribution

Local development is also the contribution workflow for this repository. The dev
script uses [portless](https://github.com/vercel-labs/portless) to provide local
HTTPS domains, which makes it possible to test live and draft versions on
different hosts:

```bash
pnpm dev
```

Open:

```text
https://headcode.localhost
https://draft.headcode.localhost
https://headcode.localhost/admin/login
https://headcode.localhost/llms.txt
https://headcode.localhost/headcode-markdown.txt/
```

Useful commands:

```bash
pnpm test:once
pnpm lint
pnpm build
pnpm exec tsc --noEmit --pretty false
pnpm dlx shadcn@latest registry validate
```

## MCP Setup

MCP access uses bearer tokens. Configure the same token list in Convex and
Next.js:

```bash
pnpm convex env set ALLOWED_MCP_TOKENS "token-one,token-two"
```

```env
ALLOWED_MCP_TOKENS=token-one,token-two
```

Use separate client names for live and draft hosts:

```json
{
  "mcp": {
    "headcode-live": {
      "type": "remote",
      "url": "https://www.example.com/mcp",
      "headers": { "Authorization": "Bearer token-one" }
    },
    "headcode-draft": {
      "type": "remote",
      "url": "https://draft.example.com/mcp",
      "headers": { "Authorization": "Bearer token-one" }
    }
  }
}
```

Verify with:

```bash
opencode mcp list
opencode run 'Use the headcode-draft MCP server. Call the headcode_get_version tool and print only the JSON result.'
```

## Distribution

Headcode is distributed through the shadcn GitHub registry:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

The root `registry.json` is the source of truth. Validate it before publishing:

```bash
pnpm dlx shadcn@latest registry validate
```

## Documentation

- [Installation](docs/installation.md)
- [Architecture](ARCHITECTURE.md)
- [Release checklist](docs/release-checklist.md)
- [Homepage working draft](docs/homepage-agent-first-working-draft.md)
- [AI markup language notes](docs/ai-markup-language-working-draft.md)

## Contributing

Headcode is early and practical help is welcome: install reports, docs fixes,
focused tests, admin UI polish, MCP improvements, and small pull requests are
all useful.

Please keep changes easy to review. The project is intentionally simple:
service boundary first, clear content model, validated section data,
agent-readable output, and no unnecessary framework churn.

## Support

Headcode CMS is a side project by Markus Tripp, built from years of website
project work and the belief that websites are becoming source material for
agents as much as destinations for humans.

Use it, fork it, open issues, send pull requests, or share what you build.

## License

MIT. See [LICENSE](LICENSE).
