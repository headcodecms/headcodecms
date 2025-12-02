import { GalleryVerticalEnd, Minus, Plus } from 'lucide-react'
import * as React from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { cacheTag } from 'next/cache'
import { getEntriesWithSections } from '@/lib/headcode'
import { DocsMetaData, docsMetaSection } from './docs-meta'
import { parseSectionData } from '@/lib/headcode/data'
import { getNav } from './nav-util'

export async function AppSidebar({
  slug,
  ...props
}: React.ComponentProps<typeof Sidebar> & { slug?: string }) {
  'use cache'
  cacheTag('/headcode/entries')

  const entries = await getEntriesWithSections('docs', { name: 'docs-meta' })
  const metas = entries
    .map((entry) => {
      const data = entry.section.data as DocsMetaData
      const parsedData = parseSectionData(docsMetaSection.fields, data)
      return { ...parsedData.data, slug: entry.entry.key }
    })
    .sort((a, b) => (a.order < b.order ? -1 : 1))

  const nav = getNav(metas, slug)
  const open = [
    'Overview',
    'Themes',
    'Admin',
    'Fields',
    'Database',
    'Storage',
    'Auth',
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="bg-muted text-muted-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map((item, index) => (
              <Collapsible
                key={index}
                defaultOpen={open.includes(item.title)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.title}{' '}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={item.isActive}
                            >
                              <a href={item.url}>{item.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
