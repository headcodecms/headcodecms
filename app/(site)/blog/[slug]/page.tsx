import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Hero, ImageSection, RenderSections } from '../../_sections'
import {
  EntryBundle,
  getHeadcodeCollectionEntry,
  getSection,
} from '../../_lib/headcode'
import type { BlogMetaData, HeroData, ImageData } from '@/headcode/sections'
import { getDataHeadcodeAttribute } from '@/headcode/utils'

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const post = await getHeadcodeCollectionEntry('blog', slug)
  const meta = post ? getBlogMeta(post) : null
  if (!meta) return {}

  return {
    title: `${meta.title} - Headcode Blog`,
    description: meta.summary,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getHeadcodeCollectionEntry('blog', slug)
  if (!post) notFound()

  const meta = getBlogMeta(post)
  if (!meta) notFound()

  const contentSections = post.sections.filter(
    (section) => section.name !== 'blog-meta' && section.name !== 'hero',
  )
  const blogMetaSection = getSection<BlogMetaData>(post.sections, 'blog-meta')
  const heroSection = getSection<HeroData>(post.sections, 'hero')
  const imageSection = getSection<ImageData>(post.sections, 'image')

  return (
    <>
      {blogMetaSection ? (
        <span
          hidden
          data-headcode={getDataHeadcodeAttribute(post.entry, blogMetaSection)}
        />
      ) : null}
      <Hero
        eyebrow={titleCase(meta.category)}
        title={meta.title}
        description={meta.summary}
        meta={
          <>
            By {meta.author} · {formatDate(meta.publishedAt)}
          </>
        }
        headcode={
          heroSection
            ? getDataHeadcodeAttribute(post.entry, heroSection)
            : undefined
        }
      />
      <ImageSection
        data={imageSection?.data ?? { image: null, caption: '' }}
        headcode={
          imageSection
            ? getDataHeadcodeAttribute(post.entry, imageSection)
            : undefined
        }
      />
      <RenderSections
        entry={post.entry}
        sections={contentSections.filter((section) => section.name !== 'image')}
      />
    </>
  )
}

const getBlogMeta = (post: EntryBundle) =>
  getSection<BlogMetaData>(post.sections, 'blog-meta')?.data

const formatDate = (value: number) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)
