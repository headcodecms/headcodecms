import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { responseStoreAdapter } from '@vinext/cloudflare/cache/response-store-adapter'
import { imagesOptimizer } from '@vinext/cloudflare/images/images-optimizer'

export default defineConfig({
  plugins: [
    vinext({
      // Workers Response Store: tag invalidation goes through a Durable
      // Object, so a write shows on every edge location at once (KV markers
      // can be up to a minute stale). See expireSite in app/(site)/_lib.
      cache: responseStoreAdapter({ mode: 'self-contained' }),
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
})
