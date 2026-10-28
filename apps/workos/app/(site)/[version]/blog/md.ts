import {
  formatDate,
  getBlogMetaSection,
  getEntrySlug,
  getHeadcodeCollectionEntries,
  getHeadcodeCollectionEntry,
} from '@/app/(site)/_lib/headcode'
import type { HeadcodeVersion } from '@/headcode/types'
import { renderSectionsMarkdown } from '@/app/(site)/_sections'

export const blogTitle = 'Field notes from Headcode'
export const blogDescription =
  'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.'

export const renderBlogIndexMarkdown = async (version: HeadcodeVersion) => {
  const posts = await getHeadcodeCollectionEntries(version, 'blog')
  const items = posts.flatMap((post) => {
    const meta = getBlogMetaSection(post)?.data
    return meta
      ? [`- [${meta.title}](/blog/${getEntrySlug(post)}): ${meta.summary}`]
      : []
  })
  return `${[`# ${blogTitle}`, '', blogDescription, '', '## Posts', '', ...items].join('\n')}\n`
}

export const renderBlogPostMarkdown = async (
  version: HeadcodeVersion,
  slug: string,
) => {
  const post = await getHeadcodeCollectionEntry(version, 'blog', slug)
  const meta = post && getBlogMetaSection(post)?.data
  if (!post || !meta) return null
  const content = renderSectionsMarkdown(
    post.sections.filter((section) => section.name !== 'hero'),
  ).trim()
  return `# ${meta.title}\n\n${meta.summary}\n\nBy ${meta.author} - ${formatDate(meta.publishedAt)}\n\n${content}\n`
}
