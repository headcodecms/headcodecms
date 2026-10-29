# Headcode CMS

A CMS for Next.js websites that people and agents both edit. It has a public site with Markdown output for agents, an admin UI, an MCP server, and draft/live publishing.

**Stack:** Next.js 16, React 19, Convex, WorkOS AuthKit, shadcn/ui, TipTap, MCP SDK v2 (spec `2026-07-28`, stateless).

## Setup

These are the exact steps used to set up this repo. Agents can follow them as written.

```bash
# 1. App (empty directory)
pnpm dlx shadcn@latest init --preset b0 --template next --pointer
pnpm install

# 2. Convex (cloud dev deployment, writes .env.local)
pnpm convex dev --once --configure new --team <team> --project <project> --dev-deployment cloud
pnpm seed   # fills the database from headcode/config.ts
```

**3. WorkOS** (dashboard, WorkOS MCP server, or `workos` CLI), for one environment:

| Setting | Value |
| --- | --- |
| Redirect URIs | `http://localhost:3000/callback` (default), `http://draft.localhost:3000/callback` |
| Sign-out URIs | `http://localhost:3000/` (default), `http://draft.localhost:3000/` |
| Initiate login URI | `http://localhost:3000/admin/login` |
| Authentication | email code + social logins, password off |
| Sign-up | enabled (new users can read, not edit) |
| JWT template | `{"headcode_role": {{ user.metadata.headcode_role || 'viewer' }}}` |
| Editors | user metadata `{ "headcode_role": "editor" }` |
| MCP OAuth | enable Client ID Metadata Document and Dynamic Client Registration |
| Resource indicators | `http://localhost:3000/mcp` (default), `http://draft.localhost:3000/mcp` |
| Branding (optional) | sign-in heading `Sign in to Headcode CMS` |

**4. Environment**

```bash
pnpm convex env set WORKOS_CLIENT_ID client_...
pnpm convex env set WORKOS_AUTHKIT_DOMAIN <name>.authkit.app
pnpm convex env set ALLOWED_MCP_TOKENS <token>   # openssl rand -hex 32
```

Add to `.env.local`:

```env
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=<name>.authkit.app
WORKOS_COOKIE_PASSWORD=<openssl rand -base64 32>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.localhost
ALLOWED_MCP_TOKENS=<same token>
```

You do not need `WORKOS_API_KEY`, because AuthKit runs as a public PKCE client.

**5. Run**

```bash
pnpm dev
```

| URL | Content |
| --- | --- |
| http://localhost:3000 | live site |
| http://draft.localhost:3000 | draft site |
| http://localhost:3000/admin | admin (sign in through AuthKit) |
| http://localhost:3000/llms.txt | agent entry point |
| http://localhost:3000/docs?md | any page as Markdown |
| http://localhost:3000/mcp | MCP endpoint (OAuth or bearer token) |

## Users and editors

- Anyone can sign up. A new user can open the admin and use MCP, but only to **read**.
- Every write (save, publish, upload, MCP edit) answers: *"Your account must be activated by an administrator before you can change content."*
- To activate a user, set their WorkOS user metadata to `{ "headcode_role": "editor" }` (dashboard, WorkOS MCP, or ask your agent). The JWT template puts this into every access token, for the admin and for MCP OAuth. A change applies when the token is refreshed (admin: within 5 minutes; MCP: re-authenticate if needed).
- The shared MCP bearer token (`ALLOWED_MCP_TOKENS`) can always write.

## Draft and live

The host decides which version you see and edit: `draft.localhost` shows the draft, every other host shows live. This applies to the site, the admin, and MCP.

| State | What happens |
| --- | --- |
| Start (after `pnpm seed`) | One version with sample content. Draft and live are **shared**, so every edit is live immediately. |
| **New draft** (Admin → Versions) | Copies live into a separate draft. Edits on the draft host are now only visible there. |
| **Publish draft** | The draft becomes live, and a new draft is copied from it automatically. |

Typical workflow:

1. Once: Admin → Versions → **New draft**.
2. Edit on `http://draft.localhost:3000/admin` (or through MCP on `draft.localhost`).
3. Check on `http://draft.localhost:3000`.
4. Admin → Versions → **Publish draft**.

Edits on the live host (`localhost:3000/admin`) change live directly. Without `NEXT_PUBLIC_HEADCODE_VERSION=auto` and `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`, there is only live.

## Caching

The site uses Next.js Cache Components. Every page is prerendered once per version (live and draft) and served as static HTML. Navigation prefetches it, so page changes are instant.

- Content comes from Convex through one cached helper (`'use cache'`, tag `headcode`).
- Saving in the admin or through MCP expires the cache, so the next page view shows the change.
- Changes made elsewhere (Convex dashboard, scripts) show up after at most one hour.
- New blog posts and pages render on their first visit and are cached after that.

## Commands

```bash
pnpm test                 # Convex service tests
pnpm seed                 # add missing globals after changing headcode/config.ts
pnpm lint
pnpm typecheck
pnpm build
pnpm mcp                  # list MCP tools (pinned to spec 2026-07-28)
pnpm mcp http://draft.localhost:3000/mcp headcode_get_version
```

## Deploy (Vercel + Convex)

1. Convex production deployment: set `WORKOS_CLIENT_ID`, `WORKOS_AUTHKIT_DOMAIN`, `ALLOWED_MCP_TOKENS` with `pnpm convex env set --prod ...`, then create a deploy key: `pnpm convex deployment token create vercel --deployment prod`.
2. WorkOS production environment: the same settings as in step 3 of the setup, with your domains (`https://<host>/callback`, `https://<host>/`, `https://<host>/mcp`). Social logins need your own OAuth credentials in production.
3. Vercel project with Root Directory `apps/workos` (or the app folder). `vercel.json` sets the build: `pnpm convex deploy && pnpm seed && pnpm build`, so functions are live and globals exist before Next.js prerenders.
4. Vercel environment variables (production): `CONVEX_DEPLOY_KEY`, `NEXT_PUBLIC_CONVEX_URL`, `WORKOS_CLIENT_ID`, `WORKOS_AUTHKIT_DOMAIN`, `WORKOS_COOKIE_PASSWORD`, `ALLOWED_MCP_TOKENS`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_HEADCODE_VERSION=auto`, `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=<draft host>`.
5. Add the live and draft domains to the Vercel project.

## MCP clients

The request host selects the content version. Register live and draft as two servers.

**OAuth (Claude Code and other OAuth clients).** Sign in once through AuthKit with a WorkOS user:

```bash
claude mcp add --transport http headcode-live http://localhost:3000/mcp
claude mcp add --transport http headcode-draft http://draft.localhost:3000/mcp
# then in Claude Code: /mcp → headcode-draft → Authenticate
```

**Bearer token (scripts, clients without OAuth):**

```json
{
  "mcpServers": {
    "headcode-draft": {
      "type": "http",
      "url": "http://draft.localhost:3000/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

How it works:

- `/.well-known/oauth-protected-resource/mcp` points clients to AuthKit, and a `401` carries the link in `WWW-Authenticate`.
- `app/mcp/auth.ts` checks the token's issuer and audience (the `/mcp` URL of the request host). Convex checks the same JWT, so MCP writes run as the signed-in user.
- The server only speaks the stateless `2026-07-28` protocol. Clients still on `initialize` (2025 era) receive `UnsupportedProtocolVersion`. MCP edits never publish unless you ask for it.

## Install into another app

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

The registry lives in the monorepo root (`registry.json`) and points into this app. Agents can follow [`public/start.md`](public/start.md).

## License

MIT
