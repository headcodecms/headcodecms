import {
  getEntrySlug,
  getHeadcodeCollectionEntries,
  getHeadcodeCollectionEntry,
  getSection,
  type EntryBundle,
} from '../_lib/headcode'
import { renderSectionsMarkdown } from '../_sections'
import type { BlogMetaData } from '@/headcode/sections'

const formatDate = (value: number) =>
  new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const getBlogMeta = (post: EntryBundle) =>
  getSection<BlogMetaData>(post.sections, 'blog-meta')?.data

export const renderBlogIndexMarkdown = async () => {
  const posts = await getHeadcodeCollectionEntries('blog')
  const lines = [
    '# Field notes from Headcode',
    '',
    'Engineering posts, product thinking, and the occasional opinion piece from the team building the agentic content platform.',
    '',
    '## Posts',
    '',
  ]

  for (const post of posts) {
    const meta = getBlogMeta(post)
    if (!meta) continue

    lines.push(
      `- [${meta.title}](/blog/${getEntrySlug(post)}): ${meta.summary}`,
    )
  }

  return `${lines.join('\n')}\n`
}

export const renderBlogPostMarkdown = async (slug: string) => {
  const post = await getHeadcodeCollectionEntry('blog', slug)
  const meta = post ? getBlogMeta(post) : null
  if (!post || !meta) return null

  const content = renderSectionsMarkdown({
    entry: post.entry,
    sections: post.sections.filter(
      (section) => section.name !== 'blog-meta' && section.name !== 'hero',
    ),
  }).trim()
  const byline = `By ${meta.author} - ${formatDate(meta.publishedAt)}`

  return `# ${meta.title}

${meta.summary}

${byline}

${content}
`
}
