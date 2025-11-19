import { createClient } from '@libsql/client'
import { createClient as createNodeClient } from '@libsql/client/node'
import { drizzle } from 'drizzle-orm/libsql'

const provider = 'sqlite'

const dbUrl = process.env.LIBSQL_URL ?? 'file:headcode.db'
const isFileUrl = dbUrl.startsWith('file:')

const client =
  process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      })
    : isFileUrl
      ? // File URLs only work with Node.js client, not Web APIs
        createNodeClient({
          url: dbUrl,
        })
      : createClient({
          url: dbUrl,
        })

const db = drizzle({ client })

export { db, provider }
