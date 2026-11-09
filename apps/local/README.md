# Headcode CMS (local)

A CMS for Next.js websites that people and agents both edit. It has a public site with Markdown output for agents, an admin UI, an MCP server, and draft/live publishing.

This app needs no cloud services. It runs on Node with a SQLite file, images on disk, and Better Auth, so you can host it wherever you like (a VPS, a container, your laptop). It behaves like `apps/vercel` and `apps/cloudflare` (same `pnpm parity` contract).

**Stack:** Next.js 16 on [vinext](https://github.com/cloudflare/vinext) (Vite, Node server), React 19, SQLite (libSQL) + Drizzle, sharp, Better Auth (email/password, OAuth 2.1 for MCP), shadcn/ui, TipTap, MCP SDK v2 (spec `2026-07-28`, stateless).

|         | apps/cloudflare              | apps/local                                 |
| ------- | ---------------------------- | ------------------------------------------ |
| Runtime | vinext on Cloudflare Workers | vinext on Node (`pnpm start`)              |
| Content | D1 + Drizzle                 | SQLite file (`data/headcode.db`) + Drizzle |
| Images  | R2, Images binding           | files in `data/media`, sharp               |
| Auth    | WorkOS AuthKit               | Better Auth                                |

## Setup

```bash
npx degit headcodecms/headcodecms/apps/local my-site
cd my-site
pnpm install
```

`.env.local`:

```env
BETTER_AUTH_SECRET=<openssl rand -base64 32>
ALLOWED_MCP_TOKENS=<openssl rand -hex 32>
NEXT_PUBLIC_SITE_URL=http://localhost:3074
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.localhost
# optional: DATABASE_URL=file:data/headcode.db, MEDIA_DIR=data/media
```

```bash
pnpm dev                          # http://localhost:3074
pnpm seed http://localhost:3074   # once: creates the tables and sample content
```

Open http://localhost:3074/admin and **create an account. The first account becomes the editor**; later accounts can read until an editor activates them.

| URL                            | Content                              |
| ------------------------------ | ------------------------------------ |
| http://localhost:3074          | live site                            |
| http://draft.localhost:3074    | draft site                           |
| http://localhost:3074/admin    | admin (sign in or create an account) |
| http://localhost:3074/llms.txt | agent entry point                    |
| http://localhost:3074/docs?md  | any page as Markdown                 |
| http://localhost:3074/mcp      | MCP endpoint (OAuth or bearer token) |

## Run in production

```bash
pnpm build
pnpm start          # vinext production server on port 3074
pnpm seed <url>     # after each deploy: pending migrations, missing globals
```

- Set `NEXT_PUBLIC_SITE_URL` to the live URL and `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS` to the draft host before `pnpm build` (they are inlined). Better Auth uses them for its issuer, trusted origins, and the MCP resources.
- Keep `data/` (database and images) on a persistent volume and back it up.
- Run one server process: the page data cache is in memory, so a second process would not see the other one's cache invalidation.
- Put it behind a reverse proxy with HTTPS for anything public.

## Users and editors

- Anyone can create an account. A new account can open the admin and use MCP, but only to **read**.
- Every write (save, publish, upload, MCP edit) answers: _"Your account must be activated by an administrator before you can change content."_
- The first account of an install is the editor. To activate another one, set its role in the database:

  ```bash
  sqlite3 data/headcode.db "UPDATE user SET headcode_role = 'editor' WHERE email = 'name@example.com'"
  ```

  Or with `pnpm db:studio`: table `user`, column `headcode_role`.

  It applies at the next sign-in (admin) or the next token (MCP).

- The shared MCP bearer token (`ALLOWED_MCP_TOKENS`) can always write. It is for scripts (seed, parity, CI); people and MCP clients use OAuth.

## Draft and live

The host decides which version you see and edit: `draft.localhost` shows the draft, every other host shows live. This applies to the site, the admin, and MCP.

| State                            | What happens                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Start (after `pnpm seed`)        | One version with sample content. Draft and live are **shared**, so every edit is live immediately. |
| **New draft** (Admin → Versions) | Copies live into a separate draft. Edits on the draft host are now only visible there.             |
| **Publish draft**                | The draft becomes live, and a new draft is copied from it automatically.                           |

## Content, images, caching

- Content lives in the SQLite file. The schema is `headcode/schema.ts` (content) and `headcode/auth-schema.ts` (Better Auth, generated with `npx auth generate`). After a change run `pnpm db:generate`; `pnpm seed <url>` applies pending migrations.
- Uploaded images are files in `data/media`, served from `/media/<key>`. `?w=<width>` returns a resized AVIF, WebP, or JPEG (sharp), cached as a file; the site uses it for `srcset`.
- Content reads are cached in memory (`'use cache'`, tag `headcode`); every save in the admin or through MCP expires the cache. Pages render per request.

## MCP clients

The request host selects the content version. Register live and draft as two servers.

**OAuth (Claude Code and other OAuth clients).** Better Auth is the authorization server. Clients register themselves (Client ID Metadata Document or Dynamic Client Registration), you sign in on `/admin/login` and allow access on `/admin/consent`:

```bash
claude mcp add --transport http headcode-live http://localhost:3074/mcp
claude mcp add --transport http headcode-draft http://draft.localhost:3074/mcp
# then in Claude Code: /mcp → headcode-draft → Authenticate
```

Tokens are JWTs bound to one `/mcp` URL (live or draft) and carry the account's `headcode_role`.

**Bearer token (scripts, clients without OAuth):**

```json
{
  "mcpServers": {
    "headcode-draft": {
      "type": "http",
      "url": "http://draft.localhost:3074/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

## Commands

```bash
pnpm dev                  # vinext dev server on port 3074
pnpm build && pnpm start  # production server
pnpm test                 # service tests (in-memory SQLite)
pnpm lint
pnpm typecheck
pnpm db:generate          # SQL migration after a schema change
pnpm db:studio            # browse and edit data/headcode.db (https://local.drizzle.studio)
pnpm seed [url]           # migrations + missing globals (default http://localhost:3074)
pnpm mcp http://draft.localhost:3074/mcp headcode_get_version
pnpm parity [url] [--write] [--login] [--admin]
pnpm drift ../cloudflare  # differences to apps/cloudflare outside the seams
```

## License

MIT
