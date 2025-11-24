import { config } from 'dotenv'
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

const turso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
const dbCredentials = turso
  ? {
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    }
  : {
      url: process.env.LIBSQL_URL ?? 'file:headcode.db',
    }

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: turso ? 'turso' : 'sqlite',
  dbCredentials,
})
