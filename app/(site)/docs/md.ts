import { getHeadcodeGlobal } from '../_lib/headcode'
import { renderSectionsMarkdown } from '../_sections'

export const renderDocsMarkdown = async () => {
  const docs = await getHeadcodeGlobal('docs')
  if (!docs) return null

  return renderSectionsMarkdown({
    entry: docs.entry,
    sections: docs.sections,
  })
}
