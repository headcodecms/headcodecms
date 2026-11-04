# Skill: Install Headcode CMS

Install Headcode CMS (Next.js, Convex, WorkOS AuthKit, MCP) into a new or existing Next.js project.

## 1. Inspect

- Empty directory, existing Next.js/shadcn app, or something else? Ask before touching anything else.
- Conflicting root files `app/page.tsx` or `app/layout.tsx`? Headcode uses route-group layouts.
- Is `pnpm` available?

## 2. Ask only for missing values

- Convex project (existing or new)
- WorkOS environment and client ID (`client_...`)
- Admin emails (they become WorkOS users)
- MCP bearer token now? (yes/no)

Never invent secrets, client IDs, or emails.

## 3. Install

```bash
# empty directory only
pnpm dlx shadcn@latest init --preset b0 --template next --pointer
rm -f app/page.tsx app/layout.tsx

pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
pnpm install
pnpm convex dev --run seed:init   # creates .env.local and fills the database
```

Merge conflicting files such as `next.config.ts` instead of overwriting them.

## 4. WorkOS

In the WorkOS environment (dashboard, WorkOS MCP server, or `workos` CLI):

- Redirect URIs: `http://localhost:3000/callback` (default), `http://draft.localhost:3000/callback`
- Sign-out URIs: `http://localhost:3000/` (default), `http://draft.localhost:3000/`
- Initiate login URI: `http://localhost:3000/admin/login`
- Authentication: email code and social logins, password off. Sign-up on: new users can read, not edit.
- JWT template: `{"headcode_role": {{ user.metadata.headcode_role || 'viewer' }}}`
- Activate editors with the user metadata `{ "headcode_role": "editor" }`.
- MCP OAuth: enable Client ID Metadata Document and Dynamic Client Registration, and add the resource indicators `http://localhost:3000/mcp` (default) and `http://draft.localhost:3000/mcp`.

## 5. Environment

```bash
pnpm convex env set WORKOS_CLIENT_ID client_...
pnpm convex env set WORKOS_AUTHKIT_DOMAIN <name>.authkit.app
pnpm convex env set ALLOWED_MCP_TOKENS <token>   # openssl rand -hex 32
```

`.env.local` (next to the values written by `convex dev`):

```env
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=<name>.authkit.app
WORKOS_COOKIE_PASSWORD=<openssl rand -base64 32>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.localhost
ALLOWED_MCP_TOKENS=<same token>
```

No `WORKOS_API_KEY` is needed (AuthKit public-client mode).

## 6. Verify

```bash
pnpm test && pnpm lint && pnpm build
pnpm dev
pnpm mcp                                          # lists MCP tools (spec 2026-07-28)
pnpm mcp http://draft.localhost:3000/mcp headcode_get_version
```

Open `http://localhost:3000` and `http://localhost:3000/admin`. Sign-in happens on the hosted AuthKit page, so the human signs in once in the browser.

## Rules

- Never commit `.env.local` or put secrets into `NEXT_PUBLIC_*`.
- Never expose MCP without authentication (OAuth or bearer token).
- Never publish content through MCP unless the user explicitly asks.
