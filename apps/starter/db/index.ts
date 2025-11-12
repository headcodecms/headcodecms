import { and, count, eq, getTableColumns } from 'drizzle-orm'
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

export const DBError = (error: unknown) => {
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

export async function getEntry(entryId: number): Promise<Entry | null> {
  try {
    const result = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId))
    return result.length > 0 ? result[0] : null
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

export async function addEntry(entry: AddEntry): Promise<Entry> {
  try {
    const result = await db.insert(entries).values(entry).returning()
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
      .orderBy(entriesToSections.pos)
  } catch (error) {
    throw DBError(error)
  }
}

export type EntriesToSectionsWithNames = EntriesToSections & { name: string }
export async function getEntriesToSectionsWithNames(
  entryId: number,
): Promise<EntriesToSectionsWithNames[]> {
  try {
    return await db
      .select({
        ...getTableColumns(entriesToSections),
        name: sections.name,
      })
      .from(entriesToSections)
      .where(eq(entriesToSections.entryId, entryId))
      .innerJoin(sections, eq(entriesToSections.sectionId, sections.id))
      .orderBy(entriesToSections.pos)
  } catch (error) {
    throw DBError(error)
  }
}
export async function deleteEntriesAllSections(entryId: number): Promise<void> {
  try {
    await db
      .delete(entriesToSections)
      .where(eq(entriesToSections.entryId, entryId))
  } catch (error) {
    throw DBError(error)
  }
}

export async function deleteEntriesToSections(
  entryId: number,
  sectionId: number,
): Promise<void> {
  try {
    await db
      .delete(entriesToSections)
      .where(
        and(
          eq(entriesToSections.entryId, entryId),
          eq(entriesToSections.sectionId, sectionId),
        ),
      )
  } catch (error) {
    throw DBError(error)
  }
}

export async function updateSection(section: Section): Promise<void> {
  try {
    await db.update(sections).set(section).where(eq(sections.id, section.id))
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

export async function deleteSection(sectionId: number): Promise<void> {
  try {
    await db.delete(sections).where(eq(sections.id, sectionId))
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

export async function addSection(section: AddSection): Promise<Section> {
  try {
    const result = await db.insert(sections).values(section).returning()
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}

export async function getSection(sectionId: number): Promise<Section | null> {
  try {
    const result = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
    return result.length > 0 ? result[0] : null
  } catch (error) {
    throw DBError(error)
  }
}
export async function addSectionToEntry(
  sectionToEntry: AddEntriesToSections,
): Promise<EntriesToSections> {
  try {
    const result = await db
      .insert(entriesToSections)
      .values(sectionToEntry)
      .returning()
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}
