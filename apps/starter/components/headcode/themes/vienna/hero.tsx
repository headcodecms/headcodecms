// hero component
import { Fields, InferSectionData } from '@/components/headcode/form/form'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { getSchema } from '@/lib/headcode/form'
import { HeroClient } from './hero-client'
import { SelectField } from '@/components/headcode/form/select-field'

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

export async function Hero({ id }: { id: string }) {
  const { section } = await getSection(id, heroSection.fields)

  console.log('section', section)

  return (
    <>
      <h1>{section.title}</h1>
      <HeroClient section={section} />
    </>
  )
}

async function getSection<F extends Fields>(
  id: string,
  fields: F,
): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}> {
  console.log('useSection', id)
  const schema = getSchema(fields)
  return {
    section: schema.parse({
      title: 'Section Title',
      description: 'Section Description',
      select: 'option1',
      plans: [
        {
          plan: 'Plan 1',
          price: 100,
        },
      ],
    }) as InferSectionData<F>,
    isDefault: false,
  }
}
