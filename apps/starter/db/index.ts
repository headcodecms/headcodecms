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

export async function addEntry(values: AddEntry): Promise<Entry> {
  try {
    const result = await db.insert(entries).values(values).returning()
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}

export async function getEntriesToSections(
  entryId: number,
): Promise<EntriesToSections[]> {
  try {
    return await db
      .select()
      .from(entriesToSections)
      .where(eq(entriesToSections.entryId, entryId))
  } catch (error) {
    throw DBError(error)
  }
}

export async function deleteEntriesToSections(entryId: number): Promise<void> {
  try {
    await db
      .delete(entriesToSections)
      .where(eq(entriesToSections.entryId, entryId))
  } catch (error) {
    throw DBError(error)
  }
}

export async function deleteSections(sectionIds: number[]): Promise<void> {
  try {
    if (sectionIds.length === 0) return

    for (const sectionId of sectionIds) {
      await db.delete(sections).where(eq(sections.id, sectionId))
    }
  } catch (error) {
    throw DBError(error)
  }
}

export async function deleteEntry(id: number): Promise<void> {
  try {
    await db.delete(entries).where(eq(entries.id, id))
  } catch (error) {
    throw DBError(error)
  }
}

export async function addSection(values: AddSection): Promise<Section> {
  try {
    const result = await db.insert(sections).values(values).returning()
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}

export async function addSectionToEntry(
  values: AddEntriesToSections,
): Promise<EntriesToSections> {
  try {
    const result = await db.insert(entriesToSections).values(values).returning()
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}
