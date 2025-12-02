import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { SelectField } from '../../form/select-field'
import { CodeBlocks } from './code-blocks'

export const codeSection = {
  name: 'code',
  label: 'Code Section',
  fields: {
    codes: {
      label: 'Code Blocks',
      fields: {
        language: SelectField({
          label: 'Language',
          defaultValue: 'ts',
          options: [
            { label: 'TypeScript', value: 'ts' },
            { label: 'TSX', value: 'tsx' },
            { label: 'JavaScript', value: 'js' },
            { label: 'JSX', value: 'jsx' },
            { label: 'HTML', value: 'html' },
            { label: 'CSS', value: 'css' },
            { label: 'JSON', value: 'json' },
            { label: 'Dotenv', value: 'dotenv' },
          ],
        }),
        filename: TextField({
          label: 'Filename',
        }),
        code: TextareaField({
          label: 'Code',
        }),
      },
    },
  } satisfies Fields,
}
export type CodeData = InferSectionData<typeof codeSection.fields>

export function Code({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(codeSection.fields, sectionData)

  return (
    <div className="mx-auto mb-12 w-full max-w-3xl">
      <CodeBlocks code={data.codes} />
    </div>
  )
}
