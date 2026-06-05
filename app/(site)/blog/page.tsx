import type { Metadata } from 'next'
import { ArrowRight, ImageIcon } from 'lucide-react'
import Link from 'next/link'

import { Container } from '../_components/container'
import { Hero, ImageWithText } from '../_sections'
import {
  EntryBundle,
  getEntrySlug,
  getHeadcodeCollectionEntries,
  getSection,
} from '../_lib/headcode'
import { buttonVariants } from '@/components/ui/button'
import type { BlogMetaData } from '@/headcode/sections'
import { getDataHeadcodeAttribute } from '@/headcode/utils'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Blog - Headcode',
  description:
    'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.',
}

export default async function BlogIndexPage() {
  const posts = await getHeadcodeCollectionEntries('blog')
  const featured = posts.filter((post) => getBlogMeta(post)?.featured)
  const featurePosts = featured.length > 0 ? featured : posts.slice(0, 1)
  const rest = posts.filter((post) => !featurePosts.includes(post))

  return (
    <>
      <Hero
        eyebrow="Blog"
        eyebrowIcon="newspaper"
        title="Field notes from Headcode"
        description="Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform."
      />
      <section className="pb-20 md:pb-28">
        <Container className="flex flex-col gap-20 md:gap-28">
          {featurePosts.map((post, index) => {
            const metaSection = getBlogMetaSection(post)
            if (!metaSection) return null
            const meta = metaSection.data

            return (
              <ImageWithText
                key={post.entry._id}
                data={{
                  eyebrow: `Featured · ${titleCase(meta.category)}`,
                  title: meta.title,
                  description: meta.summary,
                  image: null,
                  reversed: index % 2 === 1,
                  action: {
                    title: 'Read article',
                    url: `/blog/${getEntrySlug(post)}`,
                    openInNewWindow: false,
                  },
                }}
                headcode={getDataHeadcodeAttribute(post.entry, metaSection)}
                actions={
                  <Link
                    href={`/blog/${getEntrySlug(post)}`}
                    className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                  >
                    Read article
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            )
          })}
        </Container>
      </section>
      <section className="border-t pt-16 pb-20 md:pt-20 md:pb-28">
        <Container className="flex flex-col gap-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              More posts
            </h2>
            <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              {rest.length} posts
            </span>
          </div>
          <div className="flex flex-col">
            {rest.map((post) => (
              <CompactPostRow key={post.entry._id} post={post} />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

const CompactPostRow = ({ post }: { post: EntryBundle }) => {
  const metaSection = getBlogMetaSection(post)
  if (!metaSection) return null
  const meta = metaSection.data

  return (
    <Link
      href={`/blog/${getEntrySlug(post)}`}
      className="group flex flex-col gap-4 border-b py-6 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
      data-headcode={getDataHeadcodeAttribute(post.entry, metaSection)}
    >
      <div className="bg-muted relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border sm:w-48">
        <div className="from-primary/10 via-muted to-muted absolute inset-0 bg-gradient-to-br" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="text-muted-foreground size-8" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {titleCase(meta.category)} · {formatDate(meta.publishedAt)}
        </span>
        <h3 className="font-heading text-lg font-semibold tracking-tight group-hover:underline md:text-xl">
          {meta.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm md:text-base">
          {meta.summary}
        </p>
      </div>
    </Link>
  )
}

const getBlogMeta = (post: EntryBundle) => getBlogMetaSection(post)?.data

const getBlogMetaSection = (post: EntryBundle) =>
  getSection<BlogMetaData>(post.sections, 'blog-meta')

const formatDate = (value: number) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)
