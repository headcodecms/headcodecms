# Headcode CMS (Cloudflare)

A CMS for Next.js websites that people and agents both edit. It has a public site with Markdown output for agents, an admin UI, an MCP server, and draft/live publishing.

This app runs on Cloudflare Workers. It behaves like `apps/vercel` (same `pnpm parity` contract), but uses Cloudflare services instead of Vercel and Convex.

**Stack:** Next.js 16 on [vinext](https://github.com/cloudflare/vinext) (Vite), React 19, Cloudflare D1 + Drizzle, R2, Cloudflare Images binding, Workers Response Store (cache), WorkOS AuthKit, shadcn/ui, TipTap, MCP SDK v2 (spec `2026-07-28`, stateless).

|         | apps/vercel                  | apps/cloudflare                               |
| ------- | ---------------------------- | --------------------------------------------- |
| Runtime | Next.js on Vercel            | vinext on Cloudflare Workers                  |
| Content | Convex                       | D1 (SQLite) + Drizzle                         |
| Images  | Convex storage, `next/image` | R2, `/media/<key>?w=` with the Images binding |
| Auth    | WorkOS AuthKit               | WorkOS AuthKit                                |

vinext is in beta, and its Cache Components support is experimental.

## Setup

**1. App**

```bash
npx degit headcodecms/headcodecms/apps/cloudflare my-site
cd my-site
pnpm install
npx cf auth login          # Cloudflare account (opens the browser)
```

**2. WorkOS** (dashboard, WorkOS MCP server, or `workos` CLI), for one environment:

| Setting             | Value                                                                              |
| ------------------- | ---------------------------------------------------------------------------------- |
| Redirect URIs       | `http://localhost:3073/callback` (default), `http://draft.localhost:3073/callback` |
| Sign-out URIs       | `http://localhost:3073/` (default), `http://draft.localhost:3073/`                 |
| Initiate login URI  | `http://localhost:3073/admin/login`                                                |
| Authentication      | email code + social logins, password off                                           |
| Sign-up             | enabled (new users can read, not edit)                                             |
| JWT template        | `{"headcode_role": {{ user.metadata.headcode_role                                  |     | 'viewer' }}}` |
| Editors             | user metadata `{ "headcode_role": "editor" }`                                      |
| MCP OAuth           | enable Client ID Metadata Document and Dynamic Client Registration                 |
| Resource indicators | `http://localhost:3073/mcp` (default), `http://draft.localhost:3073/mcp`           |
| Branding (optional) | sign-in heading `Sign in to Headcode CMS`                                          |

**3. Environment** (`.env.local`; the Cloudflare plugin passes it to the local Worker)

```env
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=<name>.authkit.app
WORKOS_COOKIE_PASSWORD=<openssl rand -base64 32>
NEXT_PUBLIC_WORKOS_REDIRECT_URI=http://localhost:3073/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3073
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.localhost
ALLOWED_MCP_TOKENS=<openssl rand -hex 32>
```

You do not need `WORKOS_API_KEY`, because AuthKit runs as a public PKCE client. A new server-side variable must also be declared in `cloudflare.config.ts` (`bindings.secret()`).

**4. Run**

```bash
pnpm dev                          # http://localhost:3073, local D1 and R2
pnpm seed http://localhost:3073   # once: creates the tables and sample content
```

| URL                            | Content                              |
| ------------------------------ | ------------------------------------ |
| http://localhost:3073          | live site                            |
| http://draft.localhost:3073    | draft site                           |
| http://localhost:3073/admin    | admin (sign in through AuthKit)      |
| http://localhost:3073/llms.txt | agent entry point                    |
| http://localhost:3073/docs?md  | any page as Markdown                 |
| http://localhost:3073/mcp      | MCP endpoint (OAuth or bearer token) |

The admin does not load under `pnpm dev` yet (Vite pre-bundles AuthKit with server-only code). Use the production build locally for admin work:

```bash
pnpm build && pnpm preview        # same URLs, same local data
```

## Users and editors

- Anyone can sign up. A new user can open the admin and use MCP, but only to **read**.
- Every write (save, publish, upload, MCP edit) answers: _"Your account must be activated by an administrator before you can change content."_
- To activate a user, set their WorkOS user metadata to `{ "headcode_role": "editor" }` (dashboard, WorkOS MCP, or ask your agent). The JWT template puts this into every access token, for the admin and for MCP OAuth. A change applies when the token is refreshed (admin: within 5 minutes; MCP: re-authenticate if needed).
- The shared MCP bearer token (`ALLOWED_MCP_TOKENS`) can always write.

## Draft and live

The host decides which version you see and edit: `draft.localhost` shows the draft, every other host shows live. This applies to the site, the admin, and MCP.

| State                            | What happens                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Start (after `pnpm seed`)        | One version with sample content. Draft and live are **shared**, so every edit is live immediately. |
| **New draft** (Admin → Versions) | Copies live into a separate draft. Edits on the draft host are now only visible there.             |
| **Publish draft**                | The draft becomes live, and a new draft is copied from it automatically.                           |

Typical workflow:

1. Once: Admin → Versions → **New draft**.
2. Edit on `http://draft.localhost:3073/admin` (or through MCP on `draft.localhost`).
3. Check on `http://draft.localhost:3073`.
4. Admin → Versions → **Publish draft**.

## Content and images

- Content lives in D1. The schema is `headcode/schema.ts`. After a change, run `pnpm db:generate` (SQL migration in `drizzle/`). `pnpm seed <url>` applies pending migrations, then adds missing globals.
- Uploaded images go to R2 and are served from `/media/<key>`. `?w=<width>` returns a resized AVIF, WebP, or JPEG, cached at the edge; the site uses it for `srcset`. Image transformations are free up to 5,000 a month.

## Caching

- Content comes from D1 through one cached helper (`'use cache'`, tag `headcode`). The cache is the Workers Response Store: R2 for the cached data, a Durable Object for tags. A save in the admin or through MCP expires it on every edge location at once.
- Pages are rendered per request from the cached data (no page cache), so edits show immediately. Unknown pages answer with status 200 and `noindex` instead of 404.
- Changes made elsewhere (D1 console, scripts) show up after at most one hour.

## Commands

```bash
pnpm dev                  # vinext dev server on port 3073
pnpm build && pnpm preview
pnpm test                 # service tests (in-memory SQLite)
pnpm lint
pnpm typecheck
pnpm db:generate          # SQL migration after a schema change
pnpm seed [url]           # migrations + missing globals (default http://localhost:3073)
pnpm mcp                  # list MCP tools (pinned to spec 2026-07-28)
pnpm mcp http://draft.localhost:3073/mcp headcode_get_version
pnpm parity               # contract tests against http://draft.localhost:3073
pnpm parity <url> --write # also add, edit and delete a test entry (never publishes)
pnpm release              # build, deploy, migrate, seed (see Deploy)
```

## Deploy (Cloudflare)

1. **Domains:** set the live and the draft host in `cloudflare.config.ts` (`domains`, live first). The zone must be on Cloudflare. A free plan is enough. The deploy creates the DNS records and certificates.
2. **R2:** enable it once in the Cloudflare dashboard (R2 → Enable). It needs a payment method on file; the free tier covers 10 GB.
3. **WorkOS** production environment: the same settings as in setup step 2, with your hosts (`https://<host>/callback`, `https://<host>/`, `https://<host>/mcp`). Social logins need your own OAuth credentials in production.
4. **First deploy**, with the secrets in a file outside the repo (not committed, deleted afterwards):

   ```bash
   cat > /tmp/headcode-secrets.env <<'EOF'
   WORKOS_CLIENT_ID=client_...
   WORKOS_AUTHKIT_DOMAIN=<name>.authkit.app
   WORKOS_COOKIE_PASSWORD=<openssl rand -base64 32>
   ALLOWED_MCP_TOKENS=<openssl rand -hex 32>
   EOF
   printf 'MCP_TOKEN=%s\n' <same token> > .parity/<live host>.env
   pnpm release --secrets-file /tmp/headcode-secrets.env
   rm /tmp/headcode-secrets.env
   ```

   `cf deploy` creates the D1 database and the R2 buckets (images, cache) on the first run.

5. **Later deploys:** `pnpm release`. It builds with `NEXT_PUBLIC_SITE_URL` and the draft host taken from `cloudflare.config.ts`, deploys, and runs `pnpm seed` against the live host (pending migrations, missing globals).
6. Check the live and the draft host (copy `.parity/<live host>.env` to `.parity/<draft host>.env`):

   ```bash
   pnpm parity https://<host> --login            # a human signs in once
   pnpm parity https://<host> --admin --write
   ```

**About the shared token:** `ALLOWED_MCP_TOKENS` is for scripts only (seed, parity, CI). People and MCP clients (Claude, Cursor, ChatGPT) sign in with WorkOS OAuth and never need it. If it is lost, create a new one and set it with `npx cf workers secrets update`; nothing else breaks.

## MCP clients

The request host selects the content version. Register live and draft as two servers.

**OAuth (Claude Code and other OAuth clients).** Sign in once through AuthKit with a WorkOS user:

```bash
claude mcp add --transport http headcode-live https://<live host>/mcp
claude mcp add --transport http headcode-draft https://<draft host>/mcp
# then in Claude Code: /mcp → headcode-draft → Authenticate
```

**Bearer token (scripts, clients without OAuth):**

```json
{
  "mcpServers": {
    "headcode-draft": {
      "type": "http",
      "url": "https://<draft host>/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

How it works:

- `/.well-known/oauth-protected-resource/mcp` points clients to AuthKit, and a `401` carries the link in `WWW-Authenticate`.
- `app/mcp/auth.ts` checks the token's issuer and audience (the `/mcp` URL of the request host). MCP writes run as the signed-in user (`headcode_role` claim).
- The server only speaks the stateless `2026-07-28` protocol. Clients still on `initialize` (2025 era) receive `UnsupportedProtocolVersion`. MCP edits never publish unless you ask for it.

## License

MIT
