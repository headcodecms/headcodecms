# Headcode CMS Installation

This guide covers the environment setup that is easy to miss when installing
Headcode CMS with Convex Auth, Resend magic links, MCP, and local agent testing.

It is written for humans and coding agents. A human should be able to understand
each decision; an agent should be able to execute the checklist without guessing.

## Automatic Installation

The recommended installation path is agent-guided. Copy this prompt into a local
coding agent:

```text
Read https://headcodecms.com/start.md then install Headcode CMS in this directory.
```

The `/start.md` file is the canonical agent contract. It tells the agent how to
inspect the target project, which setup questions to ask, which secrets never to
invent, how to run Convex/Auth setup, and how to verify the install.

## Agent Checklist

1. Ask the setup questions below before running Convex/Auth commands.
2. Remove starter route files that conflict with Headcode.
3. Install registry files and dependencies.
4. Initialize Convex so `CONVEX_DEPLOYMENT` exists.
5. Run Convex Auth setup.
6. Configure the minimum Convex environment variables.
7. Configure optional `.env.local` client-side settings.
8. Push Convex schema/functions.
9. Start the local dev server.
10. Verify site, admin login, optional test login, and MCP.

Do not put server secrets into `NEXT_PUBLIC_*` variables. Do not commit real
`.env.local` values.

## Agent Setup Questions

Before running `pnpm convex dev`, `pnpm dlx @convex-dev/auth`, or
`pnpm convex env set`, a coding agent should ask the user for these values:

```text
1. Does this directory already contain a Next.js/shadcn app, or should I initialize one?
2. Should I use the standard Headcode site, or adapt an existing design? If adapting, where is the reference project?
3. Which Convex project should this app connect to? If none exists, should I create a new one?
4. Which local URL should auth use as SITE_URL? Usually http://localhost:3000, but use the actual dev-server port if 3000 is occupied.
5. Which admin email addresses should be allowed? Provide a comma-separated list.
6. What Resend sender should magic links use? Example: Headcode <admin@example.com>.
7. Do you have the Resend API key ready? If yes, provide it through a secure channel or set it yourself in Convex.
8. Should I enable development test login for browser agents?
9. Should I configure MCP bearer tokens now, or leave MCP disabled until later?
```

Agents should pause before asking for or setting secrets. If a secret is pasted
into chat by accident, rotate it before using the project outside local testing.
Do not reuse `JWT_PRIVATE_KEY` or `JWKS` from another project unless the user
explicitly wants both projects to share auth signing keys.

## Fast Local Install

Use this path for a new local project with one shared live/draft version on
`http://localhost:3000`. It is the preferred baseline for coding agents.

If the directory is empty, initialize a shadcn/ui Next.js starter first. Use the
preset you want for the public site design:

```bash
pnpm dlx shadcn@latest init --preset bbVJxYW --base base --template next --pointer
```

If a Next.js/shadcn app already exists, skip the init command and add Headcode
directly. Remove the starter root route files only when they exist and would
conflict with Headcode's route-group layouts:

```bash
rm -f app/page.tsx app/layout.tsx
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
pnpm install
pnpm convex dev
```

When `pnpm convex dev` asks how to configure the project, choose your existing
Convex project if you already created one.

Keep `pnpm convex dev` running until Convex has created `CONVEX_DEPLOYMENT` in
`.env.local`, then run the Convex Auth setup in another terminal:

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

`pnpm dlx @convex-dev/auth` also creates and sets `JWT_PRIVATE_KEY` and `JWKS`.
If it prints manual instructions, follow them before continuing.

This is the intended timing:

1. Run `pnpm convex dev` after the registry install so Convex can create
   `.env.local`, generate `convex/_generated`, and connect to the deployment.
2. Run `pnpm dlx @convex-dev/auth` only after `CONVEX_DEPLOYMENT` exists.
3. Run `pnpm convex env set ...` after Convex Auth setup, because auth may add
   `JWT_PRIVATE_KEY` and `JWKS`.
4. Run `pnpm auth:token` only if the user wants development test login or MCP
   bearer-token setup.
5. Start or restart `pnpm dev` after public `.env.local` values change.

Start the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin/login
```

No draft/live host configuration is required for the first local install. When
`NEXT_PUBLIC_HEADCODE_VERSION` is unset, Headcode serves the default live
version, and the initial internal version can be both live and draft.

For browser-based coding agents, enable the development-only test login after
the normal magic-link setup works:

```bash
pnpm auth:token
pnpm convex env set HEADCODE_ENABLE_TEST_LOGIN true
pnpm convex env set HEADCODE_ADMIN_TEST_EMAIL "codex@example.com"
pnpm convex env set HEADCODE_ADMIN_TEST_TOKEN "the-generated-token"
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com,codex@example.com"
```

Then add these public development values to `.env.local`:

```env
NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true
NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN=the-generated-token
```

Restart `pnpm dev` after changing `NEXT_PUBLIC_*` values.

## Agent Install Prompt

For a coding agent, use the short automatic prompt:

```text
Read https://headcodecms.com/start.md then install Headcode CMS in this directory.
```

The installable registry item is `headcodecms/headcodecms/headcode`. The shadcn
CLI reads `registry.json` directly from the public GitHub repository, so
Headcode no longer needs a hosted registry endpoint or generated JSON files.

## 1. Install Details

Headcode uses route-group root layouts in `app/(site)` and `app/(admin)`.
Before installing into a fresh shadcn/ui starter, remove the starter root route
files so they do not conflict with the Headcode routes:

```bash
rm -f app/page.tsx app/layout.tsx
```

Install Headcode CMS through the shadcn registry:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
```

Then install dependencies:

```bash
pnpm install
```

The registry includes `next.config.ts` because Headcode needs local development
origins and Convex Storage image configuration. If your project already has
custom Next.js settings, merge the Headcode settings instead of blindly
discarding your own config.

Validate the local registry before publishing changes:

```bash
pnpm dlx shadcn@latest registry validate
```

After publishing to GitHub, you can also validate the public registry:

```bash
pnpm dlx shadcn@latest registry validate headcodecms/headcodecms
```

## Convex Auth

Run the Convex Auth setup command from the project root:

```bash
pnpm dlx @convex-dev/auth
```

If this command cannot find `CONVEX_DEPLOYMENT`, start Convex first with
`pnpm convex dev` and wait until `.env.local` contains the deployment value.

The setup generates the Convex Auth signing keys and helps configure the
required Convex environment variables.

Set these variables in Convex, not only in `.env.local`. Use the Convex
dashboard or the Convex CLI:

```bash
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com,codex@example.com"
pnpm convex env set AUTH_RESEND_KEY "re_..."
pnpm convex env set AUTH_RESEND_FROM "Headcode <admin@example.com>"
pnpm convex env set SITE_URL "https://headcode.localhost"
```

The key values generated by `pnpm dlx @convex-dev/auth` must also be set in
Convex:

```env
JWT_PRIVATE_KEY=...
JWKS=...
```

`ALLOWED_ADMIN_EMAILS` is the admin allow-list. Users can only sign in when
their email is present there.

`AUTH_RESEND_FROM` must use a sender/domain configured in Resend. If it is not
set, the app falls back to the Resend onboarding sender, which is useful only
for early local testing.

`SITE_URL` must match the host used for the admin login flow. For local draft
testing this is usually:

```env
SITE_URL=https://draft.headcode.localhost
```

For production, set it to the production admin/site origin.

After changing Convex schema, auth, or service files, push the Convex backend:

```bash
pnpm convex dev
```

For production, deploy through the project's normal Convex deployment flow.

## Development Test Login

The browser-agent test login is development-only. It uses the normal
`/admin/login` page and can be triggered with `/admin/login?test=true`.

Generate a token:

```bash
pnpm auth:token
```

Set these variables in Convex:

```bash
pnpm convex env set HEADCODE_ENABLE_TEST_LOGIN true
pnpm convex env set HEADCODE_ADMIN_TEST_EMAIL "codex@example.com"
pnpm convex env set HEADCODE_ADMIN_TEST_TOKEN "the-generated-token"
```

The values are:

```env
HEADCODE_ENABLE_TEST_LOGIN=true
HEADCODE_ADMIN_TEST_EMAIL=codex@example.com
HEADCODE_ADMIN_TEST_TOKEN=the-generated-token
```

`HEADCODE_ADMIN_TEST_EMAIL` must also be listed in `ALLOWED_ADMIN_EMAILS`.

Set these variables in `.env.local` so the Next.js client can show and call the
test login helper:

```env
NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true
NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN=the-generated-token
```

The public token and Convex token must match. Restart the Next.js dev server
after changing `NEXT_PUBLIC_*` variables.

Do not set the server-side test-login variables in production. Convex uses
production bundling for functions even on dev deployments, so test login is
controlled by the explicit Convex env flag, token match, and email allow-list.

## MCP Tokens

MCP access uses bearer tokens. Set the same comma-separated token list in
Convex and in the Next.js environment:

```bash
pnpm convex env set ALLOWED_MCP_TOKENS "token-one,token-two"
```

```env
ALLOWED_MCP_TOKENS=token-one,token-two
```

Use separate MCP client server names for live and draft hosts, for example
`headcode-live` and `headcode-draft`. Version routing follows the request host,
so `draft.example.com/mcp` edits draft content and `www.example.com/mcp` edits
live content.

For OpenCode, configure each remote server with an `Authorization` header:

```json
{
  "mcp": {
    "headcode-live": {
      "type": "remote",
      "url": "https://headcode.localhost/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer token-one"
      }
    },
    "headcode-draft": {
      "type": "remote",
      "url": "https://draft.headcode.localhost/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer token-one"
      }
    }
  }
}
```

## Local Domains

The development script uses portless:

```bash
pnpm dev
```

The default local host is:

```text
https://headcode.localhost
```

For draft/live testing, use `NEXT_PUBLIC_HEADCODE_VERSION=auto` and configure
draft hosts:

```env
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.headcode.localhost
```

Then use:

```text
https://headcode.localhost
https://draft.headcode.localhost
```

For the fastest local install, skip portless and draft hosts and use
`http://localhost:3000`. The host-based draft/live setup is only needed when you
want to preview draft and live content side by side.

## Environment Reference

Convex environment variables:

| Variable                     | Required    | Scope              | Notes                                                        |
| ---------------------------- | ----------- | ------------------ | ------------------------------------------------------------ |
| `ALLOWED_ADMIN_EMAILS`       | Yes         | Convex             | Comma-separated allow-list for admin login.                  |
| `AUTH_RESEND_KEY`            | Yes         | Convex             | Resend API key for magic links.                              |
| `AUTH_RESEND_FROM`           | Recommended | Convex             | Verified sender, for example `Headcode <admin@example.com>`. |
| `SITE_URL`                   | Yes         | Convex             | Origin used by Convex Auth redirects and magic links.        |
| `JWT_PRIVATE_KEY`            | Yes         | Convex             | Generated by `pnpm dlx @convex-dev/auth`.                    |
| `JWKS`                       | Yes         | Convex             | Generated by `pnpm dlx @convex-dev/auth`.                    |
| `ALLOWED_MCP_TOKENS`         | Optional    | Convex and Next.js | Bearer token list for MCP clients.                           |
| `HEADCODE_ENABLE_TEST_LOGIN` | Dev only    | Convex             | Enables the test-token provider. Do not set in production.   |
| `HEADCODE_ADMIN_TEST_EMAIL`  | Dev only    | Convex             | Must also be listed in `ALLOWED_ADMIN_EMAILS`.               |
| `HEADCODE_ADMIN_TEST_TOKEN`  | Dev only    | Convex             | Must match `NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN`.          |

Next.js `.env.local` variables:

| Variable                                 | Required | Scope                  | Notes                                                    |
| ---------------------------------------- | -------- | ---------------------- | -------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`                      | Yes      | Next.js and Convex CLI | Created by `pnpm convex dev`.                            |
| `NEXT_PUBLIC_CONVEX_URL`                 | Yes      | Browser                | Created by Convex setup.                                 |
| `NEXT_PUBLIC_HEADCODE_VERSION`           | Optional | Browser/server         | `live`, `draft`, or `auto`; defaults to `live`.          |
| `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`       | Optional | Browser/server         | Comma-separated draft hosts used when version is `auto`. |
| `NEXT_PUBLIC_SITE_URL`                   | Optional | Server helpers         | Canonical public site URL.                               |
| `ALLOWED_MCP_TOKENS`                     | Optional | Next.js route handler  | Same bearer token list as Convex when MCP is enabled.    |
| `NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN` | Dev only | Browser                | Shows/calls the test login helper.                       |
| `NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN`  | Dev only | Browser                | Public half of the development test login token.         |

Production draft/live example:

```env
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=preview.example.com,draft.example.com
NEXT_PUBLIC_SITE_URL=https://www.example.com
```

Set Convex `SITE_URL` to the host that should own admin magic-link redirects for
that deployment. For a draft admin deployment, this is usually the draft host.

## Verification

Run the local checks:

```bash
pnpm test:once
pnpm lint
pnpm build
pnpm dlx shadcn@latest registry validate
```

Verify the browser flows:

```text
https://headcode.localhost
https://draft.headcode.localhost
https://draft.headcode.localhost/admin/login
https://draft.headcode.localhost/admin/login?test=true
```

Verify MCP after configuring a client:

```bash
opencode mcp list
opencode run 'Use the headcode-draft MCP server. Call the headcode_get_version tool and print only the JSON result.'
```

## Troubleshooting

If login shows `Invalid origin` or `Unexpected token 'I'`, the auth request is
being rejected before JSON is returned. In local development this can happen
when a proxy changes the request origin. Use the current portless development
script and restart the dev server after env changes.

If magic links do not arrive, verify:

- `AUTH_RESEND_KEY` is set in Convex.
- `AUTH_RESEND_FROM` uses a verified Resend sender/domain.
- The email is listed in `ALLOWED_ADMIN_EMAILS`.
- `SITE_URL` matches the browser origin used for admin login.
