import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { notFound } from 'next/navigation'

import type { ImageData } from '@/headcode/sections'
import {
  formatDate,
  getBlogMetaSection,
  getDataHeadcodeAttribute,
  getHeadcodeCollectionEntry,
  getSection,
  titleCase,
} from '@/app/(site)/_lib/headcode'
import {
  firstImage,
  JsonLd,
  pageMetadata,
  siteUrl,
} from '@/app/(site)/_lib/seo'
import { entryPath } from '@/headcode/utils'
import { Hero, ImageSection, RenderSections } from '@/app/(site)/_sections'

type Props = { params: Promise<{ slug: string }> }

const getPost = async (params: Props['params']) =>
  getHeadcodeCollectionEntry(await siteVersion(), 'blog', (await params).slug)

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const post = await getPost(params)
  const meta = post && getBlogMetaSection(post)?.data
  // Before the body streams, so a missing post answers with status 404.
  if (!meta) notFound()
  return meta
    ? pageMetadata({
        title: `${meta.title} - Headcode Blog`,
        description: meta.summary,
        path: entryPath(post.entry),
        image: firstImage(post.sections),
        type: 'article',
      })
    : {}
}

// Not streamed, so a missing post answers with status 404.
export default async function BlogPost({ params }: Props) {
  const post = await getPost(params)
  const metaSection = post && getBlogMetaSection(post)
  if (!post || !metaSection) notFound()

  const meta = metaSection.data
  const headcode = (name: string) => {
    const section = getSection(post.sections, name)
    return section && getDataHeadcodeAttribute(post.entry, section)
  }

  const image = firstImage(post.sections)
  return (
    <>
      <JsonLd
        data={{
          '@type': 'BlogPosting',
          headline: meta.title,
          description: meta.summary,
          datePublished: new Date(meta.publishedAt).toISOString(),
          author: { '@type': 'Person', name: meta.author },
          image: image?.src,
          url: `${siteUrl}${entryPath(post.entry)}`,
        }}
      />
      <span hidden data-headcode={headcode('blog-meta')} />
      <Hero
        eyebrow={titleCase(meta.category)}
        title={meta.title}
        description={meta.summary}
        meta={
          <>
            By {meta.author} · {formatDate(meta.publishedAt)}
          </>
        }
        headcode={headcode('hero')}
      />
      <ImageSection
        data={getSection<ImageData>(post.sections, 'image')?.data}
        headcode={headcode('image')}
      />
      <RenderSections
        entry={post.entry}
        sections={post.sections.filter(
          (section) => !['blog-meta', 'hero', 'image'].includes(section.name),
        )}
      />
    </>
  )
}
