import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const provider = 'sqlite'

const client =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      })
    : createClient({
        url: process.env.LIBSQL_URL ?? 'file:headcode.db',
      })

const db = drizzle({ client })

export { db, provider }
