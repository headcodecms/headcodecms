import Link from 'next/link'
import * as React from 'react'

type List = { type: 'list'; ordered: boolean; items: string[] }
type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string; lead: boolean }
  | { type: 'quote'; text: string }
  | List

// Minimal Markdown subset: ## / ### headings, - / 1. lists, > quotes, paragraphs.
const parseMarkdown = (content: string) => {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: List | null = null

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paragraph.join(' '),
        lead: blocks.length === 1,
      })
    }
    paragraph = []
  }
  const flushList = () => {
    if (list) blocks.push(list)
    list = null
  }

  for (const raw of content.trim().split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^(#{2,3}) ([\s\S]*)$/)
    const item = line.match(/^(-|\d+\.) (.+)$/)

    if (item) {
      flushParagraph()
      const ordered = item[1] !== '-'
      // A list of the other kind is replaced, not flushed.
      if (!list || list.ordered !== ordered)
        list = { type: 'list', ordered, items: [] }
      list.items.push(item[2])
      continue
    }
    if (!line || heading || line.startsWith('> ')) {
      flushParagraph()
      flushList()
      if (heading) {
        blocks.push({
          type: 'heading',
          level: heading[1].length,
          text: heading[2],
        })
      } else if (line) blocks.push({ type: 'quote', text: line.slice(2) })
      continue
    }
    flushList()
    paragraph.push(line)
  }
  flushParagraph()
  flushList()
  return blocks
}

const renderInline = (text: string) =>
  text
    .split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g)
    .map((part, index) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        return (
          <Link key={index} href={link[2]}>
            {link[1]}
          </Link>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index}>{part.slice(1, -1)}</code>
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <React.Fragment key={index}>{part}</React.Fragment>
    })

const renderBlock = (block: Block, index: number) => {
  switch (block.type) {
    case 'heading':
      return block.level === 2 ? (
        <h2
          key={index}
          className="font-heading mt-4 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          {renderInline(block.text)}
        </h2>
      ) : (
        <h3
          key={index}
          className="font-heading mt-2 text-xl font-semibold tracking-tight md:text-2xl"
        >
          {renderInline(block.text)}
        </h3>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={index}
          className={`flex ${block.ordered ? 'list-decimal' : 'list-disc'} flex-col gap-2 pl-6`}
        >
          {block.items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ListTag>
      )
    }
    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-2 pl-5 text-lg font-medium italic"
        >
          {renderInline(block.text)}
        </blockquote>
      )
    default:
      return (
        <p
          key={index}
          className={
            block.lead
              ? 'text-muted-foreground text-lg leading-relaxed'
              : 'text-muted-foreground'
          }
        >
          {renderInline(block.text)}
        </p>
      )
  }
}

export const Markdown = ({ content }: { content: string }) => (
  <div className="text-foreground mx-auto flex max-w-3xl flex-col gap-5 text-base leading-relaxed">
    {parseMarkdown(content).map(renderBlock)}
  </div>
)
