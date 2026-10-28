import {
  getHeadcodeCollectionEntry,
  getHeadcodeGlobal,
} from '@/app/(site)/_lib/headcode'
import { renderSectionsMarkdown } from '@/app/(site)/_sections'
import {
  renderBlogIndexMarkdown,
  renderBlogPostMarkdown,
} from '@/app/(site)/[version]/blog/md'
import type { HeadcodeVersion, ServiceEntryBundle } from '@/headcode/types'

const render = (bundle: ServiceEntryBundle | null, showHeroActions = false) =>
  bundle && renderSectionsMarkdown(bundle.sections, showHeroActions)

const renderPath = async (
  version: HeadcodeVersion,
  path: string | undefined,
  slug?: string,
) => {
  switch (path?.replace(/^\//, '')) {
    case 'blog':
      return slug
        ? renderBlogPostMarkdown(version, slug)
        : renderBlogIndexMarkdown(version)
    case 'docs':
      return render(await getHeadcodeGlobal(version, 'docs'))
    case 'pricing':
      return render(await getHeadcodeGlobal(version, 'pricing'))
    case 'pages':
      return (
        slug && render(await getHeadcodeCollectionEntry(version, 'pages', slug))
      )
    default:
      return render(await getHeadcodeGlobal(version, 'home'), true)
  }
}

export async function GET(
  _request: Request,
  { params }: RouteContext<'/[version]/headcode-markdown.txt/[[...path]]'>,
) {
  const { version, path: [path, slug] = [] } = await params
  const content = await renderPath(version as HeadcodeVersion, path, slug)
  return new Response(content || 'Not found\n', {
    status: content ? 200 : 404,
    headers: {
      vary: 'Accept',
      'content-type': `text/${content ? 'markdown' : 'plain'}; charset=utf-8`,
    },
  })
}
