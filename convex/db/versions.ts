import { Id } from '../_generated/dataModel'
import { MutationCtx, QueryCtx } from '../_generated/server'
import type { HeadcodeVersionInput, VersionInput } from '../schema_validators'

type VersionCtx = QueryCtx | MutationCtx

const getVersionByFlag = async (
  ctx: VersionCtx,
  flag: HeadcodeVersionInput,
) => {
  const index = flag === 'live' ? 'by_live' : 'by_draft'
  const versions = await ctx.db
    .query('versions')
    .withIndex(index, (q) => q.eq(flag, true))
    .take(2)

  if (versions.length > 1) {
    throw new Error(`Multiple ${flag} versions found.`)
  }

  return versions[0] ?? null
}

export const getCurrentVersion = async (
  ctx: VersionCtx,
  version: HeadcodeVersionInput,
): Promise<Id<'versions'> | null> => {
  const currentVersion = await getVersionByFlag(ctx, version)
  if (currentVersion) return currentVersion._id

  const existing = await ctx.db.query('versions').take(1)
  if (existing.length > 0) {
    throw new Error(`No ${version} version found.`)
  }

  return null
}

export const ensureInitialVersion = async (ctx: MutationCtx) => {
  const existing = await ctx.db.query('versions').take(2)

  if (existing.length > 1) {
    throw new Error('Multiple versions found during initialization.')
  }

  if (existing[0]) return existing[0]._id

  return await ctx.db.insert('versions', {
    live: true,
    draft: true,
    prepare: false,
  })
}

export const cloneDBVersion = async (
  ctx: MutationCtx,
  sourceVersion: Id<'versions'>,
  version: VersionInput,
) => {
  const clonedVersion = await ctx.db.insert('versions', version)
  const sourceEntries = await ctx.db
    .query('entries')
    .withIndex('by_version', (q) => q.eq('version', sourceVersion))
    .take(1000)

  for (const entry of sourceEntries) {
    const newEntry = await ctx.db.insert('entries', {
      slug: entry.slug,
      name: entry.name,
      modificationTime: Date.now(),
      version: clonedVersion,
    })
    const sections = await ctx.db
      .query('sections')
      .withIndex('by_entry', (q) => q.eq('entry', entry._id))
      .take(1000)

    for (const section of sections) {
      await ctx.db.insert('sections', {
        name: section.name,
        pos: section.pos,
        data: section.data,
        entry: newEntry,
      })
    }
  }

  return clonedVersion
}

export const newDBDraft = async (ctx: MutationCtx) => {
  const liveVersion =
    (await getCurrentVersion(ctx, 'live')) ?? (await ensureInitialVersion(ctx))

  const oldDraft = await getVersionByFlag(ctx, 'draft')
  const prepareVersion = await cloneDBVersion(ctx, liveVersion, {
    live: false,
    draft: false,
    prepare: true,
  })

  if (oldDraft) {
    await ctx.db.patch(oldDraft._id, { draft: false })
  }

  await ctx.db.patch(prepareVersion, {
    draft: true,
    prepare: false,
  })

  return prepareVersion
}

export const restoreDBLiveVersion = async (
  ctx: MutationCtx,
  sourceVersion: Id<'versions'>,
) => {
  const source = await ctx.db.get(sourceVersion)
  if (!source) throw new Error('Version not found.')
  if (source.live) throw new Error('Version is already live.')

  const restoredVersion = await cloneDBVersion(ctx, sourceVersion, {
    live: false,
    draft: false,
    prepare: true,
  })
  const oldLive = await getVersionByFlag(ctx, 'live')
  if (oldLive) {
    await ctx.db.patch(oldLive._id, { live: false })
  }

  await ctx.db.patch(restoredVersion, {
    live: true,
    prepare: false,
  })

  return restoredVersion
}

export const deleteDBVersion = async (
  ctx: MutationCtx,
  versionId: Id<'versions'>,
) => {
  const version = await ctx.db.get(versionId)
  if (!version) throw new Error('Version not found.')
  if (version.live || version.draft) {
    throw new Error('Live and draft versions cannot be deleted.')
  }

  let deletedEntries = 0
  let deletedSections = 0

  while (true) {
    const entries = await ctx.db
      .query('entries')
      .withIndex('by_version', (q) => q.eq('version', versionId))
      .take(100)

    if (entries.length === 0) break

    for (const entry of entries) {
      while (true) {
        const sections = await ctx.db
          .query('sections')
          .withIndex('by_entry', (q) => q.eq('entry', entry._id))
          .take(100)

        if (sections.length === 0) break

        for (const section of sections) {
          await ctx.db.delete(section._id)
          deletedSections += 1
        }
      }

      await ctx.db.delete(entry._id)
      deletedEntries += 1
    }
  }

  await ctx.db.delete(versionId)

  return {
    deleted: true,
    entries: deletedEntries,
    sections: deletedSections,
  }
}
