import { createWorkersResponseStoreSelfContainedConfig } from '@vinext/cloudflare/cache/config'
import { bindings, defineConfig, defineWorker } from 'cf/config'

// Page and data cache (vite.config.ts): R2 bodies, Durable Object metadata.
const cache = await createWorkersResponseStoreSelfContainedConfig({
  worker: 'headcode-cloudflare',
  bucket: 'headcode-cloudflare-cache',
})

export default defineConfig({
  worker: defineWorker({
    ...cache,
    name: 'headcode-cloudflare',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-11-08',
    compatibilityFlags: ['nodejs_compat'],
    // One Worker serves both hosts; the host picks live or draft, and both share
    // one cache, so a publish shows on the live site at once.
    domains: ['cloudflare.headcodecms.com', 'cloudflare-draft.headcodecms.com'],
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      ...cache.env,
      // Content (headcode/db.ts) and uploaded images (headcode/images.ts).
      DB: bindings.d1({ name: 'headcode-cloudflare' }),
      MEDIA: bindings.r2({ name: 'headcode-cloudflare-media' }),
      // Server-only values; locally from .env.local, deployed via secrets.
      WORKOS_CLIENT_ID: bindings.secret(),
      WORKOS_COOKIE_PASSWORD: bindings.secret(),
      WORKOS_AUTHKIT_DOMAIN: bindings.secret(),
      ALLOWED_MCP_TOKENS: bindings.secret(),
    },
    exports: { ...cache.exports },
  }),
})
