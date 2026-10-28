import { authkit, handleAuthkitHeaders } from '@workos-inc/authkit-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { requestOrigin } from '@/headcode/utils'
import { getHeadcodeVersionForHost } from '@/headcode/versions'

const markdownPath = /^\/(docs|pricing|blog(\/.*)?|pages\/.*)?$/

const wantsMarkdown = (req: NextRequest) =>
  req.nextUrl.searchParams.has('md') ||
  (req.headers.get('accept') ?? '')
    .split(',')
    .some((type) => type.split(';')[0].trim().toLowerCase() === 'text/markdown')

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const origin = requestOrigin(req)

  // Live and draft hosts each get their own session cookie and callback.
  if (pathname.startsWith('/admin')) {
    const { session, headers, authorizationUrl } = await authkit(req, {
      redirectUri: `${origin}/callback`,
    })
    if (!session.user && authorizationUrl)
      return handleAuthkitHeaders(req, headers, { redirect: authorizationUrl })
    return handleAuthkitHeaders(req, headers)
  }

  // Site pages live under app/(site)/[version]; the host picks the version.
  // Direct /live/... and /draft/... URLs would bypass that, so they are 404.
  if (/^\/(live|draft)(\/|$)/.test(pathname))
    return new NextResponse('Not found', { status: 404 })

  const version = getHeadcodeVersionForHost(new URL(origin).host)
  const url = req.nextUrl.clone()
  const path = pathname === '/' ? '' : pathname

  // `?md` and `Accept: text/markdown` serve the agent-readable page version.
  if (markdownPath.test(pathname) && wantsMarkdown(req)) {
    url.pathname = `/${version}/headcode-markdown.txt${path}`
    url.search = ''
  } else url.pathname = `/${version}${path}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/',
    '/docs',
    '/pricing',
    '/blog/:path*',
    '/pages/:path*',
    '/llms.txt',
    '/live/:path*',
    '/draft/:path*',
    '/admin/:path*',
  ],
}
