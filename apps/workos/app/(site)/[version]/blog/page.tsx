import { ArrowRight, ImageIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import type { BlogMetaData } from '@/headcode/sections'
import { cn } from '@/lib/utils'
import { Container } from '@/app/(site)/_components/container'
import {
  formatDate,
  getBlogMetaSection,
  getDataHeadcodeAttribute,
  getEntrySlug,
  getHeadcodeCollectionEntries,
  titleCase,
} from '@/app/(site)/_lib/headcode'
import { Hero, ImageWithText } from '@/app/(site)/_sections'
import { blogDescription, blogTitle } from './md'

export const metadata: Metadata = {
  title: 'Blog - Headcode',
  description: blogDescription,
}

type Post = {
  id: string
  meta?: BlogMetaData
  href: string
  headcode?: string
}

const PostRow = ({ meta, href, headcode }: Post) =>
  meta ? (
    <Link
      href={href}
      className="group flex flex-col gap-4 border-b py-6 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
      data-headcode={headcode}
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
  ) : null

export default async function BlogIndexPage() {
  const posts = (
    await getHeadcodeCollectionEntries(await siteVersion(), 'blog')
  ).map((post): Post => {
    const section = getBlogMetaSection(post)
    return {
      id: post.entry._id,
      meta: section?.data,
      href: `/blog/${getEntrySlug(post)}`,
      headcode: section && getDataHeadcodeAttribute(post.entry, section),
    }
  })
  const featured = posts.filter(({ meta }) => meta?.featured)
  const featurePosts = featured.length > 0 ? featured : posts.slice(0, 1)
  const rest = posts.filter((post) => !featurePosts.includes(post))

  return (
    <>
      <Hero
        eyebrow="Blog"
        eyebrowIcon="newspaper"
        title={blogTitle}
        description={blogDescription}
      />
      <section className="pb-20 md:pb-28">
        <Container className="flex flex-col gap-20 md:gap-28">
          {featurePosts.map(({ id, meta, href, headcode }, index) =>
            meta ? (
              <ImageWithText
                key={id}
                data={{
                  eyebrow: `Featured · ${titleCase(meta.category)}`,
                  title: meta.title,
                  description: meta.summary,
                  image: null,
                  reversed: index % 2 === 1,
                  action: {
                    title: 'Read article',
                    url: href,
                    openInNewWindow: false,
                  },
                }}
                headcode={headcode}
                actions={
                  <Link
                    href={href}
                    className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                  >
                    Read article
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
            ) : null,
          )}
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
              <PostRow key={post.id} {...post} />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
