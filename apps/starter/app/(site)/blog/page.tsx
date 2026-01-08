import { Container } from '@/components/headcode/themes/vienna/container'
import { getDefaultBlogEntries } from '@/components/headcode/themes/vienna/defaults'
import { blogCategoryOptions } from '@/components/headcode/themes/vienna/meta'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { getEntriesWithSections } from '@/lib/headcode'
import { ChevronRightIcon } from 'lucide-react'
import { cacheTag } from 'next/cache'
import Link from 'next/link'

export default function Blog() {
  return (
    <Container className="py-8 lg:py-16">
      <div className="flex flex-col items-center justify-center gap-6 pb-12 lg:gap-8 lg:pb-16">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <h1 className="mb-0 text-6xl font-medium md:text-7xl xl:text-[5.25rem]">
            Blog
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed text-balance md:text-xl">
            Practical guides, product updates, and best practices for modern
            support teams.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-muted-foreground text-sm font-medium">
            Categories:
          </span>
          {blogCategoryOptions.map((category) => (
            <Badge key={category.value} variant="outline" asChild>
              <Link
                href={`/blog/category/${category.value}`}
                className="hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {category.label}
              </Link>
            </Badge>
          ))}
        </div>
      </div>
      <BlogPosts />
    </Container>
  )
}

const BlogPosts = async () => {
  'use cache'
  cacheTag('/headcode/entries')

  let entries = await getEntriesWithSections('blog', { name: 'blog-meta' })
  if (entries.length === 0) {
    entries = getDefaultBlogEntries()
  }

  return (
    <Container className="py-8 lg:py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        {entries.map(({ entry, section }, index) => (
          <Item key={index} variant="outline" size="sm" asChild>
            <Link href={`/blog/${entry.key}`}>
              <ItemContent>
                <ItemTitle>{entry.key}</ItemTitle>
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
