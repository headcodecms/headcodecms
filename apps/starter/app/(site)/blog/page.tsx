import { Container } from '@/components/headcode/themes/vienna/container'
import {
  blogCategoryOptions,
  blogMetaSection,
  type BlogMetaData,
} from '@/components/headcode/themes/vienna/meta'
import { getDefaultBlogEntries } from '@/components/headcode/themes/vienna/defaults'
import { Badge } from '@/components/ui/badge'
import { getEntriesWithSections } from '@/lib/headcode'
import { parseSectionData } from '@/lib/headcode/data'
import { cn } from '@/lib/utils'
import { cacheTag } from 'next/cache'
import Image from 'next/image'
import Link from 'next/link'

export default async function Blog({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  return (
    <>
      <Container className="py-8 lg:py-16">
        <div className="flex flex-col items-center justify-center gap-4 md:items-center">
          <h1 className="mb-0 text-6xl font-medium md:text-7xl xl:text-[5.25rem]">
            Blog
          </h1>
          <p className="text-muted-foreground text-center text-lg text-balance">
            Practical guides, product updates, and best practices for modern
            support teams.
          </p>
        </div>
        <CategoryFilter activeCategory={category} />
      </Container>
      <BlogPosts category={category} />
    </>
  )
}

function CategoryFilter({ activeCategory }: { activeCategory?: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Link
        href="/blog"
        className={cn(
          'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
          !activeCategory
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border hover:bg-accent hover:text-accent-foreground',
        )}
      >
        All
      </Link>
      {blogCategoryOptions.map((category) => (
        <Link
          key={category.value}
          href={`/blog?category=${category.value}`}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            activeCategory === category.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {category.label}
        </Link>
      ))}
    </div>
  )
}

const BlogPosts = async ({ category }: { category?: string }) => {
  'use cache'
  cacheTag('/headcode/entries')

  let entries = await getEntriesWithSections('blog', { name: 'blog-meta' })
  if (entries.length === 0) {
    entries = getDefaultBlogEntries()
  }

  // Filter by category if specified
  const filteredEntries = category
    ? entries.filter(({ section }) => {
        const { data } = parseSectionData(blogMetaSection.fields, section.data)
        return data.category === category
      })
    : entries

  // Sort by date (most recent first) and then by featured
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const aData = parseSectionData(blogMetaSection.fields, a.section.data)
    const bData = parseSectionData(blogMetaSection.fields, b.section.data)

    // Featured posts come first
    if (aData.data.featured && !bData.data.featured) return -1
    if (!aData.data.featured && bData.data.featured) return 1

    // Then sort by date
    const aDate = aData.data.date ? new Date(aData.data.date).getTime() : 0
    const bDate = bData.data.date ? new Date(bData.data.date).getTime() : 0
    return bDate - aDate
  })

  if (sortedEntries.length === 0) {
    const categoryLabel = blogCategoryOptions.find(
      (c) => c.value === category,
    )?.label
    return (
      <Container className="pb-16 lg:pb-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-muted-foreground">
            No posts found{categoryLabel ? ` in "${categoryLabel}"` : ''}.
          </p>
        </div>
      </Container>
    )
  }

  return (
    <Container className="pb-16 lg:pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 lg:gap-16">
          {sortedEntries.map(({ entry, section }) => {
            const { data } = parseSectionData(
              blogMetaSection.fields,
              section.data,
            )
            return <BlogCard key={entry.key} slug={entry.key} data={data} />
          })}
        </div>
      </div>
    </Container>
  )
}

function BlogCard({ slug, data }: { slug: string; data: BlogMetaData }) {
  const categoryLabel =
    blogCategoryOptions.find((c) => c.value === data.category)?.label ||
    data.category

  const formattedDate = data.date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(data.date))
    : ''

  return (
    <Link
      href={`/blog/${slug}`}
      className="group grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10 lg:gap-16"
    >
      {/* Image */}
      <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-xl">
        {data.heroImage ? (
          <Image
            src={data.heroImage.src}
            alt={data.heroImage.alt || data.title || 'Blog post image'}
            width={data.heroImage.width}
            height={data.heroImage.height}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            blurDataURL={data.heroImage.blurDataURL || undefined}
            placeholder={data.heroImage.blurDataURL ? 'blur' : undefined}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <h2 className="group-hover:text-muted-foreground text-3xl leading-tight font-semibold tracking-tight transition-colors md:text-4xl">
          {data.title}
        </h2>

        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && categoryLabel && <span>—</span>}
          {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}
          {data.featured && <Badge variant="outline">Featured</Badge>}
        </div>
      </div>
    </Link>
  )
}
