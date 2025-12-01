import {
  DocsMetaData,
  docsMetaSection,
} from '@/app/(site)/docs/[slug]/docs-meta'
import { ImageField } from '@/components/headcode/form/image-field'
import { LinkField } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { ALink } from '@/components/headcode/links'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { parseSectionData } from '@/lib/headcode/data'
import type {
  Entry,
  Fields,
  InferSectionData,
  Section,
} from '@/lib/headcode/types'
import { MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getNav } from '@/app/(site)/docs/[slug]/nav-util'

export const headerSection = {
  name: 'header',
  label: 'Header Section',
  fields: {
    logo: ImageField({
      label: 'Logo',
    }),
    name: TextField({
      label: 'Brand Name',
    }),
    nav: {
      label: 'Navigation',
      fields: {
        link: LinkField({
          label: 'Link',
        }),
      },
    },
  } satisfies Fields,
}
export type HeaderData = InferSectionData<typeof headerSection.fields>

export function Header({
  sectionData,
  entries,
}: {
  sectionData: unknown
  entries: { entry: Entry; section: Section }[]
}) {
  const { data } = parseSectionData(headerSection.fields, sectionData)
  const metas = entries
    .map((entry) => {
      const data = entry.section.data as DocsMetaData
      const parsedData = parseSectionData(docsMetaSection.fields, data)
      return { ...parsedData.data, slug: entry.entry.key }
    })
    .sort((a, b) => (a.order < b.order ? -1 : 1))

  const docsNav = getNav(metas)

  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
        {data.logo && (
          <Image
            className="h-8 w-auto dark:invert"
            {...data.logo}
            alt={data.logo.alt}
          />
        )}
        {data.name}
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          {data.nav.map((link, index) => (
            <NavigationMenuItem key={index} className="hidden sm:block">
              <NavigationMenuLink asChild>
                <ALink link={link.link} />
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href="https://github.com/headcodecms/headcodecms">
                <GitHubIcon className="size-6" />
              </a>
            </NavigationMenuLink>{' '}
          </NavigationMenuItem>
          <NavigationMenuItem className="sm:hidden">
            <NavigationMenuLink asChild>
              <MobileSheet nav={data.nav} docsNav={docsNav} />
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

function MobileSheet({
  nav,
  docsNav,
}: {
  nav: HeaderData['nav']
  docsNav: {
    title: string
    items: { title: string; url: string; isActive: boolean }[]
  }[]
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost">
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        {nav.map((link, index) => (
          <div key={index} className="px-4">
            {link.link.url.startsWith('http') ? (
              <a
                href={link.link.url}
                target={link.link.openInNewWindow ? '_blank' : '_self'}
              >
                {link.link.title}
              </a>
            ) : (
              <Link href={link.link.url}>{link.link.title}</Link>
            )}
          </div>
        ))}
        <Separator />
        <div className="space-y-4 px-4">
          {docsNav.map((item, index) => (
            <div key={index}>
              {item.title}
              {item.items.map((item, index) => (
                <Link
                  className="hover:bg-muted block px-4 py-2"
                  href={item.url}
                  key={index}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
)
