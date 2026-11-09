import { defineConfig } from 'drizzle-kit'

// `pnpm db:generate` writes SQL migrations to drizzle/; `pnpm seed <url>`
// applies them (headcode/migrate.ts) and seeds the database.
export default defineConfig({
  dialect: 'sqlite',
  // Content and Better Auth tables (auth-schema.ts: `npx auth generate`).
  schema: ['./headcode/schema.ts', './headcode/auth-schema.ts'],
  out: './drizzle',
  // `pnpm db:studio` opens the local database in Drizzle Studio.
  dbCredentials: { url: process.env.DATABASE_URL ?? 'file:data/headcode.db' },
})
