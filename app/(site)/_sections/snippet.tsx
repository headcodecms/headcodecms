import type { SnippetData } from '@/headcode/sections'
import { InstallSnippet } from '../_components/install-snippet'
import { compactMarkdown, DocsBlock } from './render-utils'

export const SnippetSection = ({
  data,
  headcode,
}: {
  data: SnippetData
  headcode?: string
}) => (
  <DocsBlock
    title={data.title}
    description={data.description}
    headcode={headcode}
  >
    <InstallSnippet tabs={data.tabs} />
  </DocsBlock>
)

export const renderSnippetMarkdown = (data: SnippetData) =>
  compactMarkdown([
    `## ${data.title}`,
    data.description,
    data.tabs
      .map((tab) => `### ${tab.label}\n\n\`\`\`bash\n${tab.command}\n\`\`\``)
      .join('\n\n'),
  ])
