# base

The first Headcode site, ported from version 2 (`apps/local` at tag `2.1.0`). Plain Next.js; the admin follows.

- `headcode/sections.ts`: the sections, written with the Zod field helpers in `headcode/fields.ts`.
- `headcode/config.ts`: globals (single entries such as `home`) and collections (`blog`, `pages`) with their sections and default content (`headcode/defaults.ts`).
- `pnpm schema`: writes `headcode.schema.json` (for the MCP tool `schema_push`, or `headcode schema` locally) and `headcode.seed.json` (default entries for `headcode seed`).
- `app/(site)/_lib/headcode.ts`: reads live content from the backend (`HEADCODE_URL`, default `http://localhost:3080`; `HEADCODE_PROJECT`, default `demo`), cached until a publish expires the `headcode` tag.

```bash
pnpm dev        # http://localhost:3082
```
