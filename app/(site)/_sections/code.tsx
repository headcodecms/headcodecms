import type { CodeData } from '@/headcode/sections'
import { FileCodeBlock } from '../_components/code-block'
import { compactMarkdown, DocsBlock } from './render-utils'

export const CodeSection = ({
  data,
  headcode,
}: {
  data: CodeData
  headcode?: string
}) => (
  <DocsBlock
    title={data.title}
    description={data.description}
    headcode={headcode}
  >
    <FileCodeBlock files={data.files} />
  </DocsBlock>
)

export const renderCodeMarkdown = (data: CodeData) =>
  compactMarkdown([
    `## ${data.title}`,
    data.description,
    data.files
      .map(
        (file) =>
          `### ${file.filename}\n\n\`\`\`${file.language}\n${file.code}\n\`\`\``,
      )
      .join('\n\n'),
  ])
