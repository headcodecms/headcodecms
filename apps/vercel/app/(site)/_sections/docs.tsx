import type { CodeData, SnippetData, TextData } from '@/headcode/sections'
import { CodeTabs } from '../_components/code-tabs'
import { Container } from '../_components/container'
import { Markdown } from '../_components/markdown'
import { compactMarkdown, DocsBlock, type SectionProps } from './utils'

export const CodeSection = ({ data, headcode }: SectionProps<CodeData>) => (
  <DocsBlock data={data} headcode={headcode}>
    <CodeTabs
      tabs={data.files.map(({ value, filename, code }) => ({
        value,
        label: filename,
        code,
      }))}
    />
  </DocsBlock>
)

export const SnippetSection = ({
  data,
  headcode,
}: SectionProps<SnippetData>) => (
  <DocsBlock data={data} headcode={headcode}>
    <CodeTabs
      command
      tabs={data.tabs.map(({ value, label, command }) => ({
        value,
        label,
        code: command,
      }))}
    />
  </DocsBlock>
)

export const TextSection = ({ data, headcode }: SectionProps<TextData>) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container>
      <Markdown content={data.content} />
    </Container>
  </section>
)

const codeBlock = (title: string, language: string | undefined, code: string) =>
  `### ${title}\n\n\`\`\`${language}\n${code}\n\`\`\``

export const renderCodeMarkdown = (data: CodeData) =>
  compactMarkdown([
    `## ${data.title}`,
    data.description,
    data.files
      .map((file) => codeBlock(file.filename, file.language, file.code))
      .join('\n\n'),
  ])

export const renderSnippetMarkdown = (data: SnippetData) =>
  compactMarkdown([
    `## ${data.title}`,
    data.description,
    data.tabs
      .map((tab) => codeBlock(tab.label, 'bash', tab.command))
      .join('\n\n'),
  ])
