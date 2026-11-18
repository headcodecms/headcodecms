'use client'

import {
  ArrowUpRight,
  CircleUser,
  Eye,
  FileText,
  LogOut,
  Menu,
  Moon,
  Rocket,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useQuery } from '../_lib/api'
import { sitePath } from '../_lib/entries'
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
  { href: '/admin/publish', label: 'Publish', icon: Rocket },
]

const entriesPrefix = '/admin/entries/'

// Content also covers the entry pages below /admin/entries.
const isActive = (pathname: string, href: string) =>
  href === '/admin'
    ? pathname === '/admin' || pathname.startsWith(entriesPrefix)
    : pathname.startsWith(href)

const AdminHeader = () => {
  const [isDark, setIsDark] = React.useState(getInitialTheme)
  const pathname = usePathname()
  const logout = React.useRef<HTMLFormElement>(null)
  const preview = useQuery<{ token: string }>('preview_link')

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light')
  }, [isDark])

  // The page of the entry being edited, else the home page.
  const path = pathname.startsWith(entriesPrefix)
    ? sitePath(decodeURIComponent(pathname.slice(entriesPrefix.length)))
    : '/'
  const siteLinks = [
    { href: path, label: 'Live', icon: ArrowUpRight },
    ...(preview.data
      ? [
          {
            href: `/preview/${preview.data.token}${path === '/' ? '' : path}`,
            label: 'Preview',
            icon: Eye,
          },
        ]
      : []),
  ]

  return (
    <header className="border-b">
      <Container className="flex h-14 items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/admin"
            className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="font-heading text-base font-semibold tracking-tight">
              HEADCODE
            </span>
          </Link>
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
          {siteLinks.map(({ href, label }) => (
            <Button
              key={label}
              variant="ghost"
              className="hidden sm:inline-flex"
              nativeButton={false}
              render={<a href={href} target="_blank" rel="noreferrer" />}
            >
              {label}
              <ArrowUpRight />
            </Button>
          ))}
          <form ref={logout} method="post" action="/admin/logout" hidden />
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
                {siteLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={label}
                    render={<a href={href} target="_blank" rel="noreferrer" />}
                  >
                    <Icon />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setIsDark((current) => !current)}
              >
                {isDark ? <Sun /> : <Moon />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout.current?.submit()}>
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

// Admin page frame: header and page content.
export const AdminShell = ({
  children,
  dialogs,
}: {
  children: React.ReactNode
  dialogs?: React.ReactNode
}) => (
  <div className="bg-background min-h-svh">
    <AdminHeader />
    <main>
      <Container className="py-8">{children}</Container>
    </main>
    {dialogs}
  </div>
)
