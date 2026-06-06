# Skill: Install Headcode CMS

You are helping the user install Headcode CMS into a new or existing Next.js project. Headcode CMS is a shadcn registry-distributed CMS with a public site, admin UI, Convex backend, Convex Auth, image storage, draft/live versions, Markdown output, `llms.txt`, and an MCP server.

## Step 1: Gather Context

First, read the Headcode CMS README and installation guide:

https://github.com/headcodecms/headcodecms
https://github.com/headcodecms/headcodecms/blob/main/docs/installation.md

Use the local project files when the user has a local checkout. Do not guess when local files or docs can answer the question.

## Step 2: Inspect The Target Project

Inspect the current working directory before asking questions.

Determine:

1. Is this an empty directory, an existing Next.js/shadcn app, or another project type?
2. Does it already have `package.json`, `app/`, `components.json`, `next.config.ts`, `convex/`, or `.env.local`?
3. Does it already have root route files such as `app/page.tsx` or `app/layout.tsx` that conflict with Headcode route-group layouts?
4. Is `pnpm` available?

If the directory is not empty and does not look like a Next.js/shadcn app, pause and ask before changing files.

## Step 3: Ask Only For Missing Setup Choices

Ask the user only for values you do not already know from the conversation or project files:

1. Should this use the standard Headcode public site, or adapt an existing design?
2. Which Convex project should this app connect to? If none exists, should one be created?
3. Which local URL should Convex Auth use as `SITE_URL`? Use `http://localhost:3000` for the fastest local install unless the user wants local draft/live hosts.
4. Which admin email addresses should be allowed?
5. What Resend sender should magic links use? Example: `Headcode <admin@example.com>`.
6. Does the user have the Resend API key ready, and will they set it themselves or provide it through a secure channel?
7. Should development test login be enabled for browser agents?
8. Should MCP bearer tokens be configured now?
9. Should local development use simple `localhost:3000`, or portless draft/live hosts such as `https://headcode.localhost` and `https://draft.headcode.localhost`?

Never invent API keys, bearer tokens, admin emails, Resend senders, Convex project names, `JWT_PRIVATE_KEY`, or `JWKS`.

Before implementing, restate the chosen setup as an implementation contract:

- Project directory: `<path>`
- Install shape: `new app` or `existing app`
- Site design: `standard` or `adapt existing`
- Convex project: `<project or create new>`
- SITE_URL: `<url>`
- Admin emails: `<emails>`
- Resend sender: `<sender>`
- Resend key handling: `<user sets it or provided securely>`
- Development test login: `yes` or `no`
- MCP bearer tokens: `yes` or `no`
- Local hosts: `localhost` or `portless draft/live`

## Step 4: Install Headcode

For an empty directory, initialize a shadcn/ui Next.js app first:

```bash
pnpm dlx shadcn@latest init --preset bbVJxYW --base base --template next --pointer
```

For an existing Next.js/shadcn app, skip shadcn init.

If starter root route files exist and conflict with Headcode route groups, remove them:

```bash
rm -f app/page.tsx app/layout.tsx
```

Install Headcode CMS from the shadcn GitHub registry:

```bash
pnpm dlx shadcn@latest add headcodecms/headcodecms/headcode
pnpm install
```

If the install reports conflicts for existing files such as `next.config.ts`, inspect both versions and merge the Headcode settings instead of blindly discarding the user's config.

The installable registry item is `headcodecms/headcodecms/headcode`.

## Step 5: Initialize Convex And Auth

Run Convex after the registry install so `convex/` files exist:

```bash
pnpm convex dev
```

Keep it running until `.env.local` contains `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`, then run Convex Auth setup in another terminal:

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

Use the real values from the implementation contract. `pnpm dlx @convex-dev/auth` also creates `JWT_PRIVATE_KEY` and `JWKS`; follow any manual instructions it prints.

## Step 6: Optional Development Features

For development test login, generate a token:

```bash
pnpm auth:token
```

Set Convex values:

```bash
pnpm convex env set HEADCODE_ENABLE_TEST_LOGIN true
pnpm convex env set HEADCODE_ADMIN_TEST_EMAIL "codex@example.com"
pnpm convex env set HEADCODE_ADMIN_TEST_TOKEN "the-generated-token"
pnpm convex env set ALLOWED_ADMIN_EMAILS "admin@example.com,codex@example.com"
```

Add matching public values to `.env.local`:

```env
NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN=true
NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN=the-generated-token
```

For MCP, set the same bearer-token list in Convex and Next.js:

```bash
pnpm convex env set ALLOWED_MCP_TOKENS "token-one,token-two"
```

```env
ALLOWED_MCP_TOKENS=token-one,token-two
```

For portless draft/live local development, use:

```env
NEXT_PUBLIC_HEADCODE_VERSION=auto
NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS=draft.headcode.localhost
```

Then use:

```text
https://headcode.localhost
https://draft.headcode.localhost
```

For the fastest first install, prefer `http://localhost:3000` and skip draft/live host configuration.

## Step 7: Verify

Run the most relevant checks available in the target project:

```bash
pnpm lint
pnpm build
```

If Convex code or validation changed, run:

```bash
pnpm test:once
```

Verify browser flows:

```text
http://localhost:3000
http://localhost:3000/admin/login
```

For portless draft/live installs, verify:

```text
https://headcode.localhost
https://draft.headcode.localhost
https://draft.headcode.localhost/admin/login
```

If MCP was configured, verify that the route exists and that a client can call the read-only version tool:

```bash
opencode mcp list
opencode run 'Use the headcode-draft MCP server. Call the headcode_get_version tool and print only the JSON result.'
```

## Step 8: Final Response

Finish with a short checklist:

- Project directory:
- Install shape:
- Registry item:
- Convex status:
- Auth environment status:
- SITE_URL:
- Admin login URL:
- Development test login:
- MCP status:
- Draft/live host status:
- Validation result:
- Next commands:

## Important Constraints

- Do not commit real `.env.local` values.
- Do not put server secrets into `NEXT_PUBLIC_*` variables.
- Do not invent secrets or use placeholder secrets as if they were real.
- Do not configure server-side test-login variables in production.
- Do not expose MCP without a bearer token.
- Do not publish content from MCP unless the user explicitly asks for publishing.
- Do not replace an existing app design or config without first inspecting and preserving the user's work.
