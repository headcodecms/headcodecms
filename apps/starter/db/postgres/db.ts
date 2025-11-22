import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const provider = 'pg'

const client = postgres(process.env.POSTGRES_URL!, { prepare: false })
const db = drizzle({ client, schema })

export { db, provider }
