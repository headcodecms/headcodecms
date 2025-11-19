// hero component
import { Fields, InferSectionData } from '@/lib/headcode/types'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { parseSectionData } from '@/lib/headcode'
import { HeroClient } from './hero-client'
import { SelectField } from '@/components/headcode/form/select-field'
import { Section } from '@/db'

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
  console.log('section', section)
  const { data, isDefault } = parseSectionData(heroSection.fields, section.data)
  console.log('data', data, 'isDefault', isDefault)

  return (
    <>
      <h1>{section.id}</h1>
      <HeroClient data={data} />
    </>
  )
}
