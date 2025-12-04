import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { ImageIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { SignOutButton, ToggleTheme } from './nav-buttons'

export function Nav({ role }: { role?: string }) {
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL
  const storageTitle = process.env.NEXT_PUBLIC_STORAGE_TITLE ?? 'Storage'

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {role === 'admin' && storageUrl && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <a href={storageUrl}>
                <span className="hidden sm:inline">{storageTitle}</span>
                <span className="inline sm:hidden">
                  <ImageIcon className="size-4" />
                </span>
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        {role === 'admin' && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/headcode/users">
                <span className="hidden sm:inline">Users</span>
                <span className="inline sm:hidden">
                  <UsersIcon className="size-4" />
                </span>
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <ToggleTheme />
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <SignOutButton />
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
