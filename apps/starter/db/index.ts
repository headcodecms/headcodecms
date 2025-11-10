import { count, eq } from 'drizzle-orm'
import { db } from './db'
import { entries, entriesToSections, sections, user } from './schema'
import { headcodeConfig } from '@/headcode.config'

export type Role = 'user' | 'admin'

export type Entry = typeof entries.$inferSelect
export type AddEntry = typeof entries.$inferInsert

export type Section = typeof sections.$inferSelect
export type AddSection = typeof sections.$inferInsert

export type EntriesToSections = typeof entriesToSections.$inferSelect
export type AddEntriesToSections = typeof entriesToSections.$inferInsert

const version = headcodeConfig.version

const DBError = (error: unknown) => {
  console.error(error)
  return new Error(
    `DB_ERROR: ${error instanceof Error ? error.message : error}`,
  )
}

export async function noUsers(): Promise<boolean> {
  try {
    const result = await db.select({ count: count() }).from(user)
    return result[0].count === 0 ? true : false
  } catch (error) {
    throw DBError(error)
  }
}

export async function getEntries(): Promise<Entry[]> {
  try {
    const result = await db
      .select()
      .from(entries)
      .where(eq(entries.version, version))
    return result
  } catch (error) {
    throw DBError(error)
  }
}
