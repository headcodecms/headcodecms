import { getHeadcodeGlobal } from './_lib/headcode'
import { renderSectionsMarkdown } from './_sections'

export const renderHomeMarkdown = async () => {
  const home = await getHeadcodeGlobal('home')
  if (!home) return null

  return renderSectionsMarkdown({
    entry: home.entry,
    sections: home.sections,
    showHeroActions: true,
  })
}
