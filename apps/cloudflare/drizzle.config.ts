import { defineConfig } from 'drizzle-kit'

// `pnpm db:generate` writes SQL migrations to drizzle/; `pnpm seed <url>`
// applies them (headcode/migrate.ts) and seeds the database.
export default defineConfig({
  dialect: 'sqlite',
  schema: './headcode/schema.ts',
  out: './drizzle',
})
