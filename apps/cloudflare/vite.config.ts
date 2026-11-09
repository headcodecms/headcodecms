import { defineConfig } from 'vite'
import vinext from 'vinext'
import { cloudflare } from '@cloudflare/vite-plugin'
import { kvDataAdapter } from '@vinext/cloudflare/cache/kv-data-adapter'
import { imagesOptimizer } from '@vinext/cloudflare/images/images-optimizer'

export default defineConfig({
  plugins: [
    vinext({
      cache: { data: kvDataAdapter() },
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
