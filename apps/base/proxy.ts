import { NextResponse, type NextRequest } from 'next/server'

const wantsMarkdown = (req: NextRequest) =>
  req.nextUrl.searchParams.has('md') ||
  (req.headers.get('accept') ?? '')
    .split(',')
    .some((type) => type.split(';')[0].trim().toLowerCase() === 'text/markdown')

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Site pages live under app/(site)/[version]. Direct /live/... and
  // /draft/... URLs would bypass the version choice, so they are 404.
  if (/^\/(live|draft)(\/|$)/.test(pathname))
    return new NextResponse('Not found', { status: 404 })

  // Live only for now; draft preview follows with sign-in.
  const version = 'live'
  const url = req.nextUrl.clone()
  const path = pathname === '/' ? '' : pathname

  // `?md` and `Accept: text/markdown` serve the agent-readable page version.
  if (pathname !== '/llms.txt' && wantsMarkdown(req)) {
    url.pathname = `/${version}/headcode-markdown.txt${path}`
    url.search = ''
  } else url.pathname = `/${version}${path}`
  return NextResponse.rewrite(url)
}

// Every site page and the direct version URLs. Not: Next.js internals, API
// routes, and files with an extension (public assets, robots.txt,
// sitemap.xml) except /llms.txt.
export const config = {
  matcher: [
    '/((?!_next/|api/|mcp|callback|media/|\\.well-known/|.*\\.[a-z0-9]+$).*)',
    '/llms.txt',
  ],
}
