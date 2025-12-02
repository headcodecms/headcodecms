import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import Commands from './commands'

export const snippetSection = {
  name: 'snippet',
  label: 'Snippet Section',
  fields: {
    snippets: {
      label: 'Snippets',
      fields: {
        title: TextField({
          label: 'Title',
        }),
        code: TextareaField({
          label: 'Code',
        }),
      },
    },
  } satisfies Fields,
}
export type SnippetData = InferSectionData<typeof snippetSection.fields>

export function Snippet({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(snippetSection.fields, sectionData)

  return (
    <div className="mx-auto mb-12 w-full max-w-3xl">
      <Commands snippets={data.snippets} />
    </div>
  )
}
