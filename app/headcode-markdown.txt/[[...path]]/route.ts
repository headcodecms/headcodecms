import {
  renderBlogIndexMarkdown,
  renderBlogPostMarkdown,
} from '@/app/(site)/blog/md'
import { renderDocsMarkdown } from '@/app/(site)/docs/md'
import { renderHomeMarkdown } from '@/app/(site)/md'
import { renderPageMarkdown } from '@/app/(site)/pages/md'
import { renderPricingMarkdown } from '@/app/(site)/pricing/md'

export const dynamic = 'force-dynamic'

const responseHeaders = {
  'cache-control': 'no-store',
  vary: 'Accept',
}

const markdownResponse = (content: string) =>
  new Response(content, {
    headers: {
      ...responseHeaders,
      'content-type': 'text/markdown; charset=utf-8',
    },
  })

const notFoundResponse = () =>
  new Response('Not found\n', {
    status: 404,
    headers: {
      ...responseHeaders,
      'content-type': 'text/plain; charset=utf-8',
    },
  })

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const url = new URL(request.url)
  const params = await context.params
  const pathParts = params.path ?? []
  const path = pathParts[0] ?? url.searchParams.get('path')
  let content: string | null = null

  if (path === 'blog' || path === '/blog') {
    const slug = pathParts[1]
    content = slug
      ? await renderBlogPostMarkdown(slug)
      : await renderBlogIndexMarkdown()
  } else if (path === 'docs' || path === '/docs') {
    content = await renderDocsMarkdown()
  } else if (path === 'pricing' || path === '/pricing') {
    content = await renderPricingMarkdown()
  } else if (path === 'pages' || path === '/pages') {
    const slug = pathParts[1]
    content = slug ? await renderPageMarkdown(slug) : null
  } else {
    content = await renderHomeMarkdown()
  }

  if (!content) {
    return notFoundResponse()
  }

  return markdownResponse(content)
}
