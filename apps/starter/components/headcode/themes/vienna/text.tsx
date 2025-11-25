import { EditorField } from '@/components/headcode/form/editor-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { JSONContent, render } from '../../form/editor-field-renderer'

export const textSection = {
  name: 'text',
  label: 'Text Section',
  fields: {
    text: EditorField({
      label: 'Text',
    }),
  } satisfies Fields,
}
export type TextData = InferSectionData<typeof textSection.fields>

export function Text({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(textSection.fields, sectionData)

  return (
    <div className="typography mx-auto max-w-4xl">
      {data.text && render(data.text as JSONContent)}
    </div>
  )
}
