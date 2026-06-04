# Headcode CMS

Headcode CMS is a Next.js CMS built for agent-assisted editing. It includes a
public site, an admin UI, and an MCP server backed by Convex.

## Getting Started

See [docs/installation.md](docs/installation.md) for the Convex Auth, Resend,
MCP, and local development environment setup.

First, run the development server:

```bash
pnpm dev
```

Open [https://headcode.localhost](https://headcode.localhost) with your browser
to see the result.

For draft testing, use
[https://draft.headcode.localhost](https://draft.headcode.localhost).

Generate a development test-login token with:

```bash
pnpm auth:token
```

## Useful Commands

```bash
pnpm test:once
pnpm lint
pnpm dlx shadcn@latest registry validate
pnpm build
```

## Documentation

- [Installation](docs/installation.md)
- [Alpha readiness](docs/alpha-readiness.md)
- [Architecture](ARCHITECTURE.md)

## Distribution

Headcode CMS is distributed as a shadcn GitHub registry item:
`headcodecms/headcodecms/headcode`. Keep root `registry.json` in sync when
registry files change.
