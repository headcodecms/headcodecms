import { Container } from '@/components/headcode/themes/vienna/container'
import { Feature } from '@/components/headcode/themes/vienna/feature'
import { Features } from '@/components/headcode/themes/vienna/features'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import {
  blogCategoryOptions,
  blogMetaSection,
  type BlogMetaData,
} from '@/components/headcode/themes/vienna/meta'
import { Text } from '@/components/headcode/themes/vienna/text'
import {
  getDefaultBlogEntries,
  getDefaultBlogSections,
} from '@/components/headcode/themes/vienna/defaults'
import { Badge } from '@/components/ui/badge'
import { getSections } from '@/lib/headcode'
import { parseSectionData } from '@/lib/headcode/data'
import { cacheTag } from 'next/cache'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Fragment } from 'react/jsx-runtime'

export default function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <BlogPostContent params={params} />
}

const BlogPostContent = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}) => {
  'use cache'

  const { slug } = await params
  cacheTag(`/headcode/entries/blog/${slug}`)

  let sections = await getSections('blog', slug)

  // If no sections found, check if it's a default blog entry
  if (sections.length === 0) {
    const defaultEntries = getDefaultBlogEntries()
    const matchingEntry = defaultEntries.find((e) => e.entry.key === slug)

    if (matchingEntry) {
      sections = getDefaultBlogSections(slug)
    } else {
      return notFound()
    }
  }

  // Get the blog meta section (pinned)
  const metaSection = sections.find(
    (s) => s.name === 'blog-meta' || s.pinned === true,
  )

  if (!metaSection) return notFound()

  const { data: meta } = parseSectionData(
    blogMetaSection.fields,
    metaSection.data,
  )

  // Get content sections (not pinned)
  const contentSections = sections.filter(
    (s) => s.name !== 'blog-meta' && s.pinned !== true,
  )

  return (
    <>
      {/* Blog Post Header */}
      <BlogPostHeader meta={meta} />

      {/* Hero Image */}
      {meta.heroImage && (
        <Container className="pb-8 lg:pb-12">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-xl">
            <Image
              src={meta.heroImage.src}
              alt={meta.heroImage.alt || meta.title || 'Blog post image'}
              width={meta.heroImage.width}
              height={meta.heroImage.height}
              className="w-full object-cover"
              blurDataURL={meta.heroImage.blurDataURL || undefined}
              placeholder={meta.heroImage.blurDataURL ? 'blur' : undefined}
              priority
            />
          </div>
        </Container>
      )}

      {/* Content Sections */}
      <div className="pb-16 lg:pb-24">
        {contentSections.map((section) => (
          <Fragment key={section.id}>
            {section.name === 'text' && (
              <Container className="py-4 lg:py-6">
                <div className="mx-auto max-w-3xl">
                  <Text sectionData={section.data} />
                </div>
              </Container>
            )}
            {section.name === 'image' && (
              <Container className="py-4 lg:py-6">
                <div className="mx-auto max-w-4xl overflow-hidden rounded-xl">
                  <SingleImage sectionData={section.data} />
                </div>
              </Container>
            )}
            {section.name === 'feature' && (
              <Container className="py-8 lg:py-12">
                <Feature sectionData={section.data} />
              </Container>
            )}
            {section.name === 'features' && (
              <Container className="py-8 lg:py-12">
                <Features sectionData={section.data} />
              </Container>
            )}
          </Fragment>
        ))}
      </div>
    </>
  )
}

function BlogPostHeader({ meta }: { meta: BlogMetaData }) {
  const categoryLabel =
    blogCategoryOptions.find((c) => c.value === meta.category)?.label ||
    meta.category

  const formattedDate = meta.date
    ? new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(meta.date))
    : ''

  return (
    <Container className="py-8 lg:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        {/* Category Badge */}
        {categoryLabel && <Badge variant="secondary">{categoryLabel}</Badge>}

        {/* Title */}
        <h1 className="mb-0 text-4xl font-medium leading-tight tracking-tight md:text-5xl lg:text-6xl">
          {meta.title}
        </h1>

        {/* Description */}
        {meta.description && (
          <p className="text-muted-foreground text-lg leading-relaxed text-balance md:text-xl">
            {meta.description}
          </p>
        )}

        {/* Author Info */}
        <div className="mt-2 flex items-center gap-4">
          {meta.authorImage && (
            <div className="bg-muted relative size-12 overflow-hidden rounded-full">
              <Image
                src={meta.authorImage.src}
                alt={meta.author || 'Author'}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col items-start text-left">
            {meta.author && (
              <span className="font-semibold">{meta.author}</span>
            )}
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              {formattedDate && <span>{formattedDate}</span>}
              {formattedDate && meta.readTime && <span>—</span>}
              {meta.readTime && <span>{meta.readTime}</span>}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
