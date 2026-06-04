import { getHeadcodeCollectionEntry } from '../_lib/headcode'
import { renderSectionsMarkdown } from '../_sections'

export const renderPageMarkdown = async (slug: string) => {
  const page = await getHeadcodeCollectionEntry('pages', slug)
  if (!page) return null

  return renderSectionsMarkdown({
    entry: page.entry,
    sections: page.sections,
  })
}
