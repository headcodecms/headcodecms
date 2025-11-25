import { Container } from '@/components/headcode/themes/vienna/container'
import { buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { getEntries } from '@/lib/headcode'
import { ChevronRightIcon } from 'lucide-react'
import { cacheTag } from 'next/cache'
import Link from 'next/link'

export default function Pages() {
  return (
    <Container className="py-8 lg:py-16">
      <div className="flex flex-col items-center justify-center gap-8">
        <h1 className="mb-0 text-6xl font-medium text-balance md:text-7xl xl:text-[5.25rem]">
          Pages
        </h1>
        <p className="text-muted-foreground mt-0 mb-0 text-lg text-balance">
          Added pages in the Headcode Admin Panel are listed here:
        </p>
      </div>
      <PagesOverview />
    </Container>
  )
}

const PagesOverview = async () => {
  'use cache'
  cacheTag('/headcode/entries')

  const pages = await getEntries('pages')

  if (pages.length === 0) {
    return (
      <Empty className="py-8 lg:py-16">
        <EmptyHeader>
          <EmptyTitle>No pages found</EmptyTitle>
          <EmptyDescription>
            Please add a page in the Headcode Admin Panel.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            className={buttonVariants({ variant: 'outline' })}
            href="/headcode/"
          >
            Add a page
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Container className="py-8 lg:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        {pages.map((page, index) => (
          <Item key={index} variant="outline" size="sm" asChild>
            <Link href={`/pages/${page.key}`}>
              <ItemContent>
                <ItemTitle>{page.key}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </Link>
          </Item>
        ))}
      </div>
    </Container>
  )
}
