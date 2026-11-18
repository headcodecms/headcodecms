# base

The first Headcode site, ported from version 2 (`apps/local` at tag `2.1.0`). Plain Next.js, with the admin at `/admin` (content, images, publish, preview link, snapshots).

- `headcode/sections.ts`: the sections, written with the Zod field helpers in `headcode/fields.ts`.
- `headcode/config.ts`: globals (single entries such as `home`) and collections (`blog`, `pages`) with their sections and default content (`headcode/defaults.ts`).
- `pnpm schema`: writes `headcode.schema.json` (for the MCP tool `schema_push`, or `headcode schema` locally) and `headcode.seed.json` (default entries for `headcode seed`).
- `app/(site)/_lib/headcode.ts`: reads live content from the backend (`HEADCODE_URL`, default `http://localhost:3080`; `HEADCODE_PROJECT`, default `demo`) with `'use cache'`, so live pages are prerendered (the build needs the backend) and stay cached until a publish expires the `headcode` tag.
- `/api/revalidate`: the backend calls it after publish and rollback, signed with `HEADCODE_REVALIDATE_SECRET` (HMAC-SHA256 over timestamp and body); it expires the `headcode` tag.
- `/preview/<token>/...`: the draft for everyone with the project's preview link (from the admin's Publish page), read per request, with a banner, `noindex` and `Referrer-Policy: same-origin`.
- `/admin`: signs in at apps/auth (`AUTH_URL`, default `http://localhost:3081`; `HEADCODE_CLIENT_ID` from `pnpm client` there) and edits the draft through the backend's MCP tools with the user's token (`headcode/admin.ts`, `app/(admin)/admin/api`).

```bash
pnpm dev        # http://localhost:3082
```
