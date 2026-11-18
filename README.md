# Headcode CMS

Turn a vibe-coded website into a real CMS: agents edit content through MCP, people use a simple admin UI, and changes go through draft and publish. A text change is no longer a deployment.

**Version 3 is in development on this branch.** The released version 2 is the [`2.1.0`](https://github.com/headcodecms/headcodecms/tree/2.1.0) tag; version 1 is on the [`v1`](https://github.com/headcodecms/headcodecms/tree/v1) branch.

## Apps

| App                            | What it is                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`apps/backend`](apps/backend) | Rust (axum, rmcp, sqlx): the MCP server per project, Postgres; embedded Postgres locally        |
| [`apps/auth`](apps/auth)       | Next.js with Better Auth: sign-in and the OAuth 2.1 server for MCP clients, shared by all sites |
| `apps/base`                    | planned: the first site with admin (Next.js); `www`, `blog`, `docs`, `shopify` follow |

## Run it locally

```bash
pnpm install
pnpm dev                                    # backend on :3080, auth on :3081
node apps/backend/scripts/smoke.mjs         # MCP client flow end to end
```

Locally `dev@headcode.local` is admin of the `demo` project; sign up with that address in the auth app.

## License

MIT
