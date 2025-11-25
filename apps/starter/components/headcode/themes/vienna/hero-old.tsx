import { CheckboxField } from '@/components/headcode/form/checkbox-field'
import { EditorField } from '@/components/headcode/form/editor-field'
import { ImageField } from '@/components/headcode/form/image-field'
import { LinkField } from '@/components/headcode/form/link-field'
import { SelectField } from '@/components/headcode/form/select-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData, Section } from '@/lib/headcode/types'
import { HeroClient } from './hero-old-client'

export const heroSection = {
  name: 'hero',
  label: 'Hero Section',
  fields: {
    title: TextField({
      label: 'Title Mex',
      description: 'Title description',
      defaultValue: 'Default Title',
    }),
    description: TextareaField({ label: 'Description Mex' }),
    select: SelectField({
      label: 'Select Mex',
      defaultValue: 'option2',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ],
    }),
    checkbox: CheckboxField({
      label: 'Checkbox Mex',
      defaultValue: false,
    }),
    link: LinkField({
      label: 'Link Mex',
      description: 'Link description',
      defaultValue: {
        title: 'Default Title',
        url: 'https://www.google.com',
        openInNewWindow: false,
      },
    }),
    image: ImageField({
      label: 'Image Mex',
      defaultValue: null,
    }),
    editor: EditorField({
      label: 'Editor Mex',
      defaultValue: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Default Editor' }],
          },
        ],
      },
    }),
    plans: {
      label: 'Plans',
      fields: {
        plan: TextField({
          label: 'Plan Title',
          description: 'Plan description',
          defaultValue: 'Default Plan',
        }),
        price: TextField({
          label: 'Plan Price',
          description: 'Plan price description',
          defaultValue: 'Default Price',
        }),
      },
    },
  } satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>

export async function Hero({ section }: { section: Section }) {
  const { data, isDefault } = parseSectionData(heroSection.fields, section.data)

  return (
    <>
      <h1>{section.id}</h1>
      <HeroClient data={data} />
    </>
  )
}
