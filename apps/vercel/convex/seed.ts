import { internalMutation } from './_generated/server'
import { headcodeConfig } from '../headcode/config'
import * as db from './db'

// Fills the database from headcode/config.ts (`pnpm seed`, safe to repeat):
// - an empty install gets one version (live and draft shared) and one sample
//   entry per collection,
// - every run adds configured globals that are missing in live or draft.
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const empty = (await ctx.db.query('versions').take(1)).length === 0
    const live = await db.ensureVersionId(ctx, 'live')
    const draft = await db.ensureVersionId(ctx, 'draft')

    for (const version of new Set([live, draft])) {
      for (const { slug } of headcodeConfig.globals)
        if (!(await db.getGlobal(ctx, slug, version)))
          await db.createEntry(ctx, { slug, name: null }, version)
      if (!empty) continue
      for (const { slug, defaults } of headcodeConfig.collections) {
        const meta = defaults.find(
          (section) => section.name === 'meta' || section.name === 'blog-meta',
        )?.data as { title?: string } | undefined
        await db.createEntry(ctx, { slug, name: meta?.title ?? slug }, version)
      }
    }
  },
})
