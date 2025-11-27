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

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  'use cache'
  cacheTag('/headcode/entries')

  const entries = await getEntriesWithSections('docs', { name: 'docs-meta' })
  const metas = entries
    .map((entry) => {
      const data = entry.section.data as DocsMetaData
      const parsedData = parseSectionData(docsMetaSection.fields, data)
      return { ...parsedData.data, slug: entry.entry.key, isActive: false }
    })
    .sort((a, b) => (a.order < b.order ? -1 : 1))

  const nav = [
    {
      title: 'Overview',
      items: metas
        .filter((meta) => meta.group === 'overview')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
    {
      title: 'Themes',
      items: metas
        .filter((meta) => meta.group === 'themes')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
    {
      title: 'Fields',
      items: metas
        .filter((meta) => meta.group === 'fields')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
    {
      title: 'Database',
      items: metas
        .filter((meta) => meta.group === 'database')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
    {
      title: 'Storage',
      items: metas
        .filter((meta) => meta.group === 'storage')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
    {
      title: 'Auth',
      items: metas
        .filter((meta) => meta.group === 'auth')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.isActive,
        })),
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-muted text-muted-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 0}
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
