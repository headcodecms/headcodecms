'use client'

import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { HeaderMegaData } from './header-mega'
import { LinkValue } from '../../form/link-field'
import { ALink } from '../../links'

export function MegaMenu({
  data,
  pages,
}: {
  data: HeaderMegaData
  pages: LinkValue[]
}) {
  const isMobile = useIsMobile()
  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <MenuItemMega
          title={data.mega1Title}
          image={data.mega1Image}
          imageLink={data.mega1ImageLink}
          links={data.mega1Links}
        />

        <MenuItemMega
          title={data.mega2Title}
          image={data.mega2Image}
          imageLink={data.mega2ImageLink}
          links={data.mega2Links}
        />

        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>Pages</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                {pages.map((page, index) => (
                  <NavigationMenuLink key={index} asChild>
                    <Link href={page.url}>{page.title}</Link>
                  </NavigationMenuLink>
                ))}
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuLink asChild>
            <Link href="/blog">Blog</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>Sections</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                {data.sections.map((link, index) => (
                  <NavigationMenuLink key={index} asChild>
                    <ALink link={link.link} />
                  </NavigationMenuLink>
                ))}
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="md:hidden">
          <NavigationMenuLink asChild>
            <MobileSheet data={data} pages={pages} />
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function MenuItemMega({
  title,
  image,
  imageLink,
  links,
}: {
  title: string
  image: HeaderMegaData['mega1Image']
  imageLink: HeaderMegaData['mega1ImageLink']
  links: HeaderMegaData['mega1Links']
}) {
  return (
    <NavigationMenuItem className="hidden md:block">
      <NavigationMenuTrigger>{title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
          {image && (
            <li className="row-span-3">
              <NavigationMenuLink asChild>
                <Link href={imageLink?.url || '/'}>
                  <Image
                    className="w-full"
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    blurDataURL={image.blurDataURL || undefined}
                  />
                </Link>
              </NavigationMenuLink>
            </li>
          )}
          {links.map((link, index) => (
            <ListItem key={index} href={link.link.url} title={link.link.title}>
              {link.description}
            </ListItem>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function MobileSheet({
  data,
  pages,
}: {
  data: HeaderMegaData
  pages: LinkValue[]
}) {
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

        <div className="px-4">{data.mega1Title}</div>
        {data.mega1Links.map((link, index) => (
          <div key={index} className="text-muted-foreground px-8">
            <ALink link={link.link} />
          </div>
        ))}

        <div className="px-4">{data.mega2Title}</div>
        {data.mega2Links.map((link, index) => (
          <div key={index} className="text-muted-foreground px-8">
            <ALink link={link.link} />
          </div>
        ))}

        <div className="px-4">Pages</div>
        {pages.map((page, index) => (
          <div key={index} className="text-muted-foreground px-8">
            <ALink link={page} />
          </div>
        ))}

        <div className="px-4">
          <Link href="/blog">Blog</Link>
        </div>

        <div className="px-4">Sections</div>
        {data.sections.map((link, index) => (
          <div key={index} className="text-muted-foreground px-8">
            <ALink link={link.link} />
          </div>
        ))}
      </SheetContent>
    </Sheet>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
