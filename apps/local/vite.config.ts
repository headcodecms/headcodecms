import vinext from 'vinext'
import { defineConfig } from 'vite'

// Node build: `pnpm build && pnpm start` (vinext production server).
export default defineConfig({
  plugins: [vinext()],
})
