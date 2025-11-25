import { ImageField } from '@/components/headcode/form/image-field'
import { LinkField, LinkValue } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ALink } from '../../links'

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

export function Header({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(headerSection.fields, sectionData)

  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
        {data.logo && (
          <Image className="h-8 w-auto" {...data.logo} alt={data.logo.alt} />
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

          <NavigationMenuItem className="sm:hidden">
            <NavigationMenuLink asChild>
              <MobileSheet nav={data.nav} />
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

function MobileSheet({ nav }: { nav: HeaderData['nav'] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost">
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
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
      </SheetContent>
    </Sheet>
  )
}
