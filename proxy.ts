import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from '@convex-dev/auth/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

const isAuthRoute = createRouteMatcher(['/admin/login'])
const isProtectedRoute = createRouteMatcher(['/admin(.*)'])
const markdownGlobalPaths = new Set(['/', '/docs', '/pricing'])

const isMarkdownPath = (pathname: string) =>
  markdownGlobalPaths.has(pathname) ||
  pathname === '/blog' ||
  pathname.startsWith('/blog/') ||
  pathname.startsWith('/pages/')

const acceptsMarkdown = (accept: string | null) =>
  accept
    ?.split(',')
    .some(
      (value) => value.trim().split(';')[0]?.toLowerCase() === 'text/markdown',
    ) ?? false

const shouldServeMarkdown = (req: NextRequest) =>
  isMarkdownPath(req.nextUrl.pathname) &&
  (req.nextUrl.searchParams.has('md') ||
    acceptsMarkdown(req.headers.get('accept')))

const isLocalOrigin = (origin: string | null) => {
  if (!origin) return false

  const url = new URL(origin)
  return (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.endsWith('.localhost')
  )
}

const normalizeDevelopmentAuthRequest = (req: NextRequest) => {
  if (
    process.env.NODE_ENV !== 'development' ||
    req.nextUrl.pathname !== '/api/auth' ||
    req.method !== 'POST' ||
    !process.env.PORTLESS_URL ||
    !isLocalOrigin(req.headers.get('origin'))
  ) {
    return req
  }

  const headers = new Headers(req.headers)
  headers.delete('origin')

  return new NextRequest(req, { headers })
}

const authMiddleware = convexAuthNextjsMiddleware(
  async (req, { convexAuth }) => {
    if (shouldServeMarkdown(req)) {
      const path = req.nextUrl.pathname
      const url = req.nextUrl.clone()
      url.pathname =
        path === '/'
          ? '/headcode-markdown.txt'
          : `/headcode-markdown.txt${path}`
      url.search = ''

      return NextResponse.rewrite(url)
    }

    if (isAuthRoute(req)) {
      if (await convexAuth.isAuthenticated()) {
        return nextjsMiddlewareRedirect(req, '/admin')
      }

      return
    }

    if (isProtectedRoute(req) && !(await convexAuth.isAuthenticated())) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.search = new URLSearchParams({
        next: `${req.nextUrl.pathname}${req.nextUrl.search}`,
      }).toString()

      return NextResponse.redirect(loginUrl)
    }
  },
)

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  return authMiddleware(normalizeDevelopmentAuthRequest(req), event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
