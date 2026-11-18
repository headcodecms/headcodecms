import { NextResponse, type NextRequest } from 'next/server'

import { cookie, expiresIn, requestTokens, setTokens } from '@/headcode/admin'

const wantsMarkdown = (req: NextRequest) =>
  req.nextUrl.searchParams.has('md') ||
  (req.headers.get('accept') ?? '')
    .split(',')
    .some((type) => type.split(';')[0].trim().toLowerCase() === 'text/markdown')

// The admin needs a valid access token; an expired one is refreshed here,
// where cookies can still be set for this request and the response.
const admin = async (req: NextRequest) => {
  const { pathname, origin } = req.nextUrl
  if (['/admin/login', '/admin/callback', '/admin/logout'].includes(pathname))
    return NextResponse.next()
  const access = req.cookies.get(cookie.access)?.value
  if (access && expiresIn(access) > 60) return NextResponse.next()
  const refresh = req.cookies.get(cookie.refresh)?.value
  const tokens =
    refresh &&
    (await requestTokens({
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }))
  if (tokens) {
    req.cookies.set(cookie.access, tokens.access_token)
    const res = NextResponse.next({ request: { headers: req.headers } })
    setTokens(res, tokens)
    return res
  }
  if (pathname === '/admin/api')
    return Response.json({ error: 'Not signed in.' }, { status: 401 })
  const login = new URL('/admin/login', origin)
  login.searchParams.set('returnTo', pathname)
  return NextResponse.redirect(login)
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return admin(req)

  // Site pages live under app/(site)/[version]: `live`, or `preview-<token>`
  // for /preview/<token>/... (the draft, for everyone with the link).
  const preview = /^\/preview\/([A-Za-z0-9_-]+)(\/.*)?$/.exec(pathname)
  const version = preview ? `preview-${preview[1]}` : 'live'
  const path = preview ? (preview[2] ?? '') : pathname === '/' ? '' : pathname
  const url = req.nextUrl.clone()

  // `?md` and `Accept: text/markdown` serve the agent-readable page version.
  if (path !== '/llms.txt' && wantsMarkdown(req)) {
    url.pathname = `/${version}/headcode-markdown.txt${path}`
    url.search = ''
  } else url.pathname = `/${version}${path}`
  const res = NextResponse.rewrite(url)
  if (preview) {
    // The token stays on this site and out of search engines.
    res.headers.set('Referrer-Policy', 'same-origin')
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return res
}

// Every site page, the preview, and the admin. Not: Next.js internals, API
// routes (revalidate), and files with an extension (public assets,
// robots.txt, sitemap.xml) except /llms.txt.
export const config = {
  matcher: [
    '/((?!_next/|api/|.*\\.[a-z0-9]+$).*)',
    '/llms.txt',
    '/preview/:token/llms.txt',
  ],
}
