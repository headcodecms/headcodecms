# Headcode Release Checklist

This checklist is the manual version of a future `headcode doctor` command. Use
it before tagging a public release or before asking an agent to install Headcode
into a new project.

## Doctor Checklist

Run these checks from the project root:

```bash
pnpm test:once
pnpm lint
pnpm dlx shadcn@latest registry validate
pnpm build
```

Then verify the local app:

```text
https://headcode.localhost
https://headcode.localhost/admin/login
https://headcode.localhost/llms.txt
https://headcode.localhost/headcode-markdown.txt/
```

For draft/live projects, also verify:

```text
https://draft.headcode.localhost
https://draft.headcode.localhost/admin
```

For MCP projects, verify the configured client can call the read-only version
tool before attempting writes:

```bash
opencode mcp list
opencode run 'Use the headcode-draft MCP server. Call the headcode_get_version tool and print only the JSON result.'
```

## Environment Checks

Confirm Convex environment variables:

- `ALLOWED_ADMIN_EMAILS`
- `AUTH_RESEND_KEY`
- `AUTH_RESEND_FROM`
- `SITE_URL`
- `JWT_PRIVATE_KEY`
- `JWKS`
- `ALLOWED_MCP_TOKENS`, when MCP is enabled

Confirm `.env.local` values:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_HEADCODE_VERSION`, when draft/live routing is configured
- `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`, when version is `auto`
- `NEXT_PUBLIC_SITE_URL`, when canonical URLs are needed

Development test login is optional. If enabled, confirm the public token and
Convex token match, and confirm `HEADCODE_ADMIN_TEST_EMAIL` is in
`ALLOWED_ADMIN_EMAILS`.

## Install Checks

Validate the registry locally:

```bash
pnpm dlx shadcn@latest registry validate
```

After publishing to the final public repository, validate the GitHub registry:

```bash
pnpm dlx shadcn@latest registry validate headcodecms/headcodecms
pnpm dlx shadcn@latest view headcodecms/headcodecms/headcode
```

Do one empty-project install and one existing-design install before a public
release. In both tests, the installing agent should ask for Convex project,
`SITE_URL`, allowed admin emails, Resend sender/key, test-login preference, and
MCP-token preference before running auth/env commands.

## Release Hardening

Admin UI:

- Entry overview, entry editor, image gallery, version controls, and login work
  in light and dark mode.
- Keyboard navigation works on overview and entry editor lists.
- Dialog stack behavior matches the prototype: backdrop closes one level, escape
  closes one level, and close/cancel language is consistent.
- Field renderers handle missing, invalid, and default values without crashing.
- Image uploads enforce configured size/type limits and store `{ imageId }` in
  section data.

MCP:

- Tool descriptions say normal edits must not publish unless explicitly asked.
- MCP tools cover admin parity for entry and section operations.
- `headcode_upload_image_from_url` is the preferred image tool.
- Local binary uploads document the `create upload URL -> POST file -> register`
  flow.
- MCP host routing matches site/admin routing: draft hosts edit draft, live hosts
  edit live.

Production deployment:

- Convex Auth env is configured on the target deployment.
- Resend sender domain is verified.
- `SITE_URL` matches the deployment that owns admin magic-link redirects.
- Draft/live hosts are configured with
  `NEXT_PUBLIC_HEADCODE_VERSION=auto` and `NEXT_PUBLIC_HEADCODE_DRAFT_HOSTS`.
- `next.config.ts` includes Convex Storage image host configuration.
- Test-login server-side variables are not set in production.

Release:

- Registry validates locally and from GitHub.
- `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, and `docs/installation.md` match
  the final repository name and install command.
- The old implementation, if replaced, is preserved with a release tag before
  the new source tree lands on the release branch.
