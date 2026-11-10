// Seam: the database driver. apps/local uses a libSQL (SQLite) file;
// apps/cloudflare uses D1 with the same schema.
import { mkdirSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as authSchema from './auth-schema'
import * as schema from './schema'

const url = process.env.DATABASE_URL ?? 'file:storage/headcode.db'
if (url.startsWith('file:'))
  mkdirSync(url.slice('file:'.length).replace(/\/[^/]*$/, '') || '.', {
    recursive: true,
  })

const client = createClient({ url })

export const getDb = () => drizzle(client, { schema })

// Better Auth tables (headcode/auth-schema.ts, generated).
export const authDb = drizzle(client, { schema: authSchema })
