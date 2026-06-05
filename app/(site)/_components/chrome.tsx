'use client'

import { Menu, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { FooterData, HeaderData } from '@/headcode/sections'
import { cn } from '@/lib/utils'
import { Container } from './container'

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.56C20.71 21.37 24 17.08 24 12 24 5.73 18.77.5 12 .5z" />
  </svg>
)

export const SiteHeader = ({
  data,
  headcode,
}: {
  data: HeaderData
  headcode?: string
}) => {
  const [isDark, setIsDark] = React.useState(true)
  const navLinks = [
    ...data.navigation.map((item) => item.navItem),
    data.primaryLink,
  ].filter((link) => link.title && link.url)

  React.useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    setIsDark(next)
  }

  return (
    <header
      className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur"
      data-headcode={headcode}
    >
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="font-heading text-base font-semibold tracking-tight">
            {data.brand.toUpperCase()}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={`${link.title}-${link.url}`}
              href={link.url}
              target={link.openInNewWindow ? '_blank' : undefined}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.title}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="GitHub repository">
            <GithubIcon className="size-4" />
          </Button>
        </nav>
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-3/4 sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigate the site.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-4">
                {navLinks.map((link) => (
                  <SheetClose
                    key={`${link.title}-${link.url}`}
                    nativeButton={false}
                    render={
                      <Link
                        href={link.url}
                        className="hover:bg-muted focus-visible:ring-ring flex items-center rounded-md px-3 py-2.5 text-base font-medium focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {link.title}
                      </Link>
                    }
                  />
                ))}
              </nav>
              <div className="mt-auto border-t p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="GitHub repository"
                >
                  <GithubIcon className="size-4" />
                  GitHub
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  )
}

export const SiteFooter = ({
  data,
  headcode,
}: {
  data: FooterData
  headcode?: string
}) => (
  <footer className="border-t py-10" data-headcode={headcode}>
    <Container className="flex flex-col items-center justify-between gap-4 md:flex-row">
      <span className="text-muted-foreground text-sm">{data.copyright}</span>
      <nav className="flex items-center gap-4 text-sm">
        {data.navigation.map(({ navItem }) => (
          <Link
            key={`${navItem.title}-${navItem.url}`}
            href={navItem.url}
            target={navItem.openInNewWindow ? '_blank' : undefined}
            className="text-muted-foreground hover:text-foreground"
          >
            {navItem.title}
          </Link>
        ))}
      </nav>
    </Container>
  </footer>
)
