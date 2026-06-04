import { getHeadcodeGlobal } from '../_lib/headcode'
import { renderSectionsMarkdown } from '../_sections'

export const renderPricingMarkdown = async () => {
  const pricing = await getHeadcodeGlobal('pricing')
  if (!pricing) return null

  return renderSectionsMarkdown({
    entry: pricing.entry,
    sections: pricing.sections,
  })
}
