import { and, asc, count, eq, getTableColumns } from 'drizzle-orm'
import { db } from './db'
import { entries, sections, user } from './schema'
import type { Entry, AddEntry, Section, AddSection } from '@/lib/headcode/types'
import { getVersion } from '@/lib/headcode/config'

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

export async function getEntries(
  namespace?: string | undefined,
): Promise<Entry[]> {
  try {
    const result = await db
      .select()
      .from(entries)
      .where(
        and(
          eq(entries.version, getVersion()),
          namespace ? eq(entries.namespace, namespace) : undefined,
        ),
      )
    return result
  } catch (error) {
    throw DBError(error)
  }
}

export async function getEntriesCount(version?: string | null) {
  try {
    const result = await db
      .select({ count: count() })
      .from(entries)
      .where(version ? eq(entries.version, version) : undefined)
    return result.length > 0 ? result[0].count : 0
  } catch (error) {
    throw DBError(error)
  }
}

export async function getEntriesWithSections(
  namespace: string,
  filter?: { name?: string; pinned?: boolean } | undefined,
): Promise<{ entry: Entry; section: Section }[]> {
  try {
    const result = await db
      .select({
        entry: { ...getTableColumns(entries) },
        section: { ...getTableColumns(sections) },
      })
      .from(sections)
      .innerJoin(entries, eq(sections.entryId, entries.id))
      .where(
        and(
          eq(entries.version, getVersion()),
          eq(entries.namespace, namespace),
          filter?.name ? eq(sections.name, filter.name) : undefined,
          filter?.pinned ? eq(sections.pinned, filter.pinned) : undefined,
        ),
      )
      .orderBy(asc(entries.id), asc(sections.pos))
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

export async function deleteEntry(id: number): Promise<void> {
  try {
    await db.delete(entries).where(eq(entries.id, id))
  } catch (error) {
    throw DBError(error)
  }
}

export async function getSection(
  id: number,
): Promise<{ section: Section; entry: Entry } | null> {
  try {
    const result = await db
      .select({
        section: { ...getTableColumns(sections) },
        entry: { ...getTableColumns(entries) },
      })
      .from(sections)
      .innerJoin(entries, eq(sections.entryId, entries.id))
      .where(eq(sections.id, id))
    return result.length > 0 ? result[0] : null
  } catch (error) {
    throw DBError(error)
  }
}

export async function getSectionsById(entryId: number): Promise<Section[]> {
  try {
    const result = await db
      .select()
      .from(sections)
      .where(eq(sections.entryId, entryId))
      .orderBy(asc(sections.pos))
    return result
  } catch (error) {
    throw DBError(error)
  }
}

export async function getSections(
  namespace: string,
  key: string,
  filter?: { name?: string; pinned?: boolean } | undefined,
): Promise<Section[]> {
  try {
    const result = await db
      .select({ ...getTableColumns(sections) })
      .from(sections)
      .innerJoin(entries, eq(sections.entryId, entries.id))
      .where(
        and(
          eq(entries.version, getVersion()),
          eq(entries.namespace, namespace),
          eq(entries.key, key),
          filter?.name ? eq(sections.name, filter.name) : undefined,
          filter?.pinned ? eq(sections.pinned, filter.pinned) : undefined,
        ),
      )
      .orderBy(asc(sections.pos))
    return result
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

export async function updateSection(section: Section): Promise<void> {
  try {
    await db.update(sections).set(section).where(eq(sections.id, section.id))
  } catch (error) {
    throw DBError(error)
  }
}

export async function reorderSections(
  items: { id: number; pos: number }[],
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(sections)
          .set({ pos: item.pos })
          .where(eq(sections.id, item.id))
      }
    })
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

export async function deleteSections(entryId: number): Promise<void> {
  try {
    await db.delete(sections).where(eq(sections.entryId, entryId))
  } catch (error) {
    throw DBError(error)
  }
}

export async function cloneVersion(clone: string): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const cloneEntries = await tx
        .select()
        .from(entries)
        .where(eq(entries.version, clone))

      for (const cloneEntry of cloneEntries) {
        const newEntry = await tx
          .insert(entries)
          .values({
            version: getVersion(),
            namespace: cloneEntry.namespace,
            key: cloneEntry.key,
          })
          .returning()

        const cloneSections = await tx
          .select()
          .from(sections)
          .where(eq(sections.entryId, cloneEntry.id))

        for (const cloneSection of cloneSections) {
          await tx.insert(sections).values({
            entryId: newEntry[0].id,
            name: cloneSection.name,
            pos: cloneSection.pos,
            pinned: cloneSection.pinned,
            data: cloneSection.data,
          })
        }
      }
    })
  } catch (error) {
    throw DBError(error)
  }
}
