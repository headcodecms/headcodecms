import Link from 'next/link'
import * as React from 'react'

type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string; lead?: boolean }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }

const parseMarkdown = (content: string) => {
  const blocks: Block[] = []
  const lines = content.trim().split('\n')
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({
      type: 'paragraph',
      text: paragraph.join(' '),
      lead: blocks.length === 1,
    })
    paragraph = []
  }

  const flushList = () => {
    if (!list) return
    blocks.push({ type: 'list', ordered: list.ordered, items: list.items })
    list = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: 3, text: line.slice(4) })
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: 2, text: line.slice(3) })
      continue
    }

    const unordered = line.match(/^- (.+)$/)
    if (unordered) {
      flushParagraph()
      if (!list || list.ordered) list = { ordered: false, items: [] }
      list.items.push(unordered[1])
      continue
    }

    const ordered = line.match(/^\d+\. (.+)$/)
    if (ordered) {
      flushParagraph()
      if (!list || !list.ordered) list = { ordered: true, items: [] }
      list.items.push(ordered[1])
      continue
    }

    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'quote', text: line.slice(2) })
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return blocks
}

const renderInline = (text: string) => {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
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
}

export const Prose = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-foreground mx-auto flex max-w-3xl flex-col gap-5 text-base leading-relaxed">
      {children}
    </div>
  )
}

export const Markdown = ({ content }: { content: string }) => {
  const blocks = parseMarkdown(content)

  return (
    <Prose>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = block.level === 2 ? 'h2' : 'h3'
          return (
            <Heading
              key={index}
              className={
                block.level === 2
                  ? 'font-heading mt-4 text-2xl font-semibold tracking-tight md:text-3xl'
                  : 'font-heading mt-2 text-xl font-semibold tracking-tight md:text-2xl'
              }
            >
              {renderInline(block.text)}
            </Heading>
          )
        }

        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List
              key={index}
              className={
                block.ordered
                  ? 'flex list-decimal flex-col gap-2 pl-6'
                  : 'flex list-disc flex-col gap-2 pl-6'
              }
            >
              {block.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </List>
          )
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="border-l-2 pl-5 text-lg font-medium italic"
            >
              {renderInline(block.text)}
            </blockquote>
          )
        }

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
      })}
    </Prose>
  )
}
