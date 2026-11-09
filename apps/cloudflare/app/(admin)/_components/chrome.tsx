'use client'

import { useAuth } from '@workos-inc/authkit-nextjs/components'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import {
  ArrowUpRight,
  CircleUser,
  FileText,
  History,
  ImageIcon,
  LogOut,
  Menu,
  Moon,
  Sun,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdminHeadcodeVersion } from '../_lib/headcode'
import { LoadingState } from './admin-ui'
import { Container } from './container'

const themeStorageKey = 'headcode-admin-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(themeStorageKey)
  return stored === 'light' || stored === 'dark'
    ? stored === 'dark'
    : document.documentElement.classList.contains('dark')
}

const navItems = [
  { href: '/admin', label: 'Content', icon: FileText },
  { href: '/admin/images', label: 'Images', icon: ImageIcon },
  { href: '/admin/versions', label: 'Versions', icon: History },
]

// Content also covers the entry pages below /admin/entries.
const isActive = (pathname: string, href: string) =>
  href === '/admin'
    ? pathname === '/admin' || pathname.startsWith('/admin/entries')
    : pathname.startsWith(href)

const AdminHeader = ({
  version,
  versionResolved = true,
}: {
  version: 'live' | 'draft'
  versionResolved?: boolean
}) => {
  const [isDark, setIsDark] = React.useState(getInitialTheme)
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <header className="border-b">
      <Container className="flex h-14 items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="font-heading text-base font-semibold tracking-tight">
                HEADCODE
              </span>
            </Link>
            <span
              className={`bg-muted text-muted-foreground rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium uppercase ${versionResolved ? '' : 'invisible'}`}
              aria-hidden={!versionResolved}
            >
              {version}
            </span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ href, label }) => {
              const active = isActive(pathname, href)
              return (
                <Button
                  key={href}
                  variant={active ? 'secondary' : 'ghost'}
                  aria-current={active ? 'page' : undefined}
                  nativeButton={false}
                  render={<Link href={href} />}
                >
                  {label}
                </Button>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="hidden sm:inline-flex"
            nativeButton={false}
            render={<Link href="/" />}
          >
            View site
            <ArrowUpRight />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="sm:hidden" />
                  <CircleUser className="hidden sm:block" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {/* On mobile the menu also holds the navigation. */}
              <DropdownMenuGroup className="sm:hidden">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} render={<Link href={href} />}>
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem render={<Link href="/" />}>
                  <ArrowUpRight />
                  View site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              {user && (
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                </DropdownMenuGroup>
              )}
              <DropdownMenuItem
                onClick={() => setIsDark((current) => !current)}
              >
                {isDark ? <Sun /> : <Moon />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  void signOut({ returnTo: `${location.origin}/` })
                }
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Container>
    </header>
  )
}

// Admin page frame: header, auth states, and page content once signed in.
export const AdminShell = ({
  loadingLabel,
  children,
  dialogs,
}: {
  loadingLabel: string
  children: React.ReactNode
  dialogs?: React.ReactNode
}) => {
  const { version, resolved } = useAdminHeadcodeVersion()

  return (
    <div className="bg-background min-h-svh">
      <AdminHeader version={version} versionResolved={resolved} />
      <main>
        <Container className="py-8">
          <AuthLoading>
            <LoadingState>{loadingLabel}</LoadingState>
          </AuthLoading>
          <Unauthenticated>
            <p className="text-muted-foreground text-sm">Signing in...</p>
          </Unauthenticated>
          <Authenticated>{children}</Authenticated>
        </Container>
      </main>
      {dialogs}
    </div>
  )
}
