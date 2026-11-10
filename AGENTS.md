# Headcode CMS monorepo – Agent Guide

Turborepo with independent apps in `apps/*`. Each app has its own `AGENTS.md` with the app rules; read it before you change an app.

## Rules

- Apps share nothing: no `workspace:` dependencies, no `packages/`, no imports or config outside the app folder. Each app keeps its own `package.json`, lockfile, `pnpm-workspace.yaml`, tsconfig, ESLint, Prettier and `components.json` (shadcn/ui).
- An app must work after `npx degit headcodecms/headcodecms/apps/<app>`. Check that before you finish.
- `apps/vercel` is the reference app. Variants (`www`, `blog`, `docs`, `shopify`) start as a copy of it and should differ mainly in `headcode/config.ts`, sections, and content. When you fix something in the core (`convex/`, `app/mcp`, admin), note it in `apps/vercel/CHANGELOG.md` so variants can follow.
- Platform apps (`vercel`, `cloudflare`, `local`) are reference builds, not a matrix. Themes run on one platform only. Other combinations (for example Cloudflare with BetterAuth) are built by the user's agent from these sources, like shadcn/ui components.
- Every app passes `pnpm parity <url> --write` (copied from `apps/vercel/scripts/parity.mts`), locally and after each deploy.
- `apps/cloudflare` and `apps/local` are copies with the same core; platform code lives only in seam files. `pnpm drift ../<other app>` must pass in both before you finish (see their AGENTS.md).
- Root `registry.json` is the shadcn registry: `headcode` (paths into `apps/vercel`), `headcode-cloudflare`, and `headcode-local` (paths into those apps). `target` values are paths in the user's app. When you add, move, or delete a core file, update all three items, and run `pnpm dlx shadcn@latest registry validate` after you change files listed there. `convert.md` installs the item for the platform the user picks.
- The root only holds Turborepo, the workspace list, the registry and docs. Ask before you add anything else to the root.

## Commands

```bash
pnpm install
pnpm dev --filter <package-name>
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Run Convex commands (`pnpm convex dev`, `pnpm convex env set`) inside the app folder.
