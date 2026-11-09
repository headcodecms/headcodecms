import { sql } from 'drizzle-orm'

import journal from '../drizzle/meta/_journal.json'
import type { Db } from './services'

// Applies the SQL migrations from drizzle/ (written by `pnpm db:generate`)
// that are not yet recorded in __migrations. Runs from `pnpm seed`.
const files = import.meta.glob<string>('../drizzle/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export const migrate = async (db: Db) => {
  await db.run(
    sql`CREATE TABLE IF NOT EXISTS __migrations (tag TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)`,
  )
  const applied = new Set(
    (await db.all<{ tag: string }>(sql`SELECT tag FROM __migrations`)).map(
      (row) => row.tag,
    ),
  )
  const pending = journal.entries.filter(({ tag }) => !applied.has(tag))
  for (const { tag } of pending) {
    const file = files[`../drizzle/${tag}.sql`]
    if (!file) throw new Error(`Migration ${tag}.sql is missing.`)
    for (const statement of file.split('--> statement-breakpoint'))
      if (statement.trim()) await db.run(sql.raw(statement))
    await db.run(
      sql`INSERT INTO __migrations (tag, applied_at) VALUES (${tag}, ${Date.now()})`,
    )
  }
  return pending.map(({ tag }) => tag)
}
