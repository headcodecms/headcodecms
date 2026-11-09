// Seam: the database driver. Cloudflare uses D1 (binding DB in
// cloudflare.config.ts); apps/local uses libSQL with the same schema.
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

export const getDb = () => drizzle(env.DB, { schema })
