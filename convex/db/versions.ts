import { Id } from '../_generated/dataModel'
import { MutationCtx, QueryCtx } from '../_generated/server'
import type { HeadcodeVersionInput } from '../schema_validators'

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

export const newDBDraft = async (ctx: MutationCtx) => {
  const liveVersion =
    (await getCurrentVersion(ctx, 'live')) ?? (await ensureInitialVersion(ctx))

  const oldDraft = await getVersionByFlag(ctx, 'draft')
  const prepareVersion = await ctx.db.insert('versions', {
    live: false,
    draft: false,
    prepare: true,
  })

  const liveEntries = await ctx.db
    .query('entries')
    .withIndex('by_version', (q) => q.eq('version', liveVersion))
    .take(1000)

  for (const entry of liveEntries) {
    const newEntry = await ctx.db.insert('entries', {
      slug: entry.slug,
      name: entry.name,
      modificationTime: Date.now(),
      version: prepareVersion,
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

  if (oldDraft) {
    await ctx.db.patch(oldDraft._id, { draft: false })
  }

  await ctx.db.patch(prepareVersion, {
    draft: true,
    prepare: false,
  })

  return prepareVersion
}
