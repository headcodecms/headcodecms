import { MutationCtx, QueryCtx } from '../_generated/server'
import {
  validateSection,
  validateSectionForStorage,
} from '../section_validations'
import { SectionInput } from '../schema_validators'
import { Id } from '../_generated/dataModel'

export const getDBSections = async (ctx: QueryCtx, entryId: Id<'entries'>) => {
  const sections = await ctx.db
    .query('sections')
    .withIndex('by_entry', (q) => q.eq('entry', entryId))
    .take(1000)

  return [...sections]
    .sort((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0))
    .map((item) => validateSection(item))
}

export const addDBSection = async (
  ctx: MutationCtx,
  section: SectionInput,
) => ctx.db.insert('sections', validateSectionForStorage(section))
