'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Home, ImageIcon, LogOut, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Container } from './container'

const themeStorageKey = 'headcode-admin-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return true

  const storedTheme = window.localStorage.getItem(themeStorageKey)

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme === 'dark'
  }

  return document.documentElement.classList.contains('dark')
}

export const AdminHeader = ({
  version,
  versionResolved = true,
}: {
  version: 'live' | 'draft'
  versionResolved?: boolean
}) => {
  const [isDark, setIsDark] = React.useState(getInitialTheme)
  const { signOut } = useAuthActions()

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    setIsDark((current) => !current)
  }

  return (
    <header className="border-b">
      <Container className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="font-heading text-base font-semibold tracking-tight">
              HEADCODE
            </span>
          </Link>
          <Link
            href="/admin/versions"
            className={`focus-visible:ring-ring bg-muted text-muted-foreground hover:bg-muted/80 rounded-md border px-1.5 py-0.5 font-mono text-xs font-medium uppercase focus-visible:ring-2 focus-visible:outline-none ${versionResolved ? '' : 'invisible'}`}
            aria-hidden={!versionResolved}
            tabIndex={versionResolved ? undefined : -1}
          >
            {version}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open images"
            nativeButton={false}
            render={<Link href="/admin/images" />}
          >
            <ImageIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open homepage"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Home />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut />
          </Button>
        </div>
      </Container>
    </header>
  )
}
