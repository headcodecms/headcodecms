import { SelectField } from '@/components/headcode/form/select-field'
import { TextField } from '@/components/headcode/form/text-field'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { TextareaField } from '../../form/textarea-field'
import { ImageField } from '../../form/image-field'
import { DatePickerField } from '../../form/date-picker-field'
import { SwitchField } from '../../form/switch-field'

export const metaSection = {
  name: 'meta',
  label: 'Meta Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    ogImage: ImageField({
      label: 'OG Image',
      description: 'Use 1200x630px for best results',
    }),
  } satisfies Fields,
}

export const blogCategoryOptions: { label: string; value: string }[] = [
  { label: 'News', value: 'news' },
  { label: 'Tutorial', value: 'tutorial' },
  { label: 'Press Release', value: 'press-release' },
]
export const blogMetaSection = {
  name: 'blog-meta',
  label: 'Blog Meta Section',
  fields: {
    ...metaSection.fields,

    author: TextField({
      label: 'Author',
    }),
    date: DatePickerField({
      label: 'Published Date',
    }),
    featured: SwitchField({
      label: 'Featured',
      defaultValue: false,
    }),
    category: SelectField({
      label: 'Category',
      options: blogCategoryOptions,
    }),
    order: TextField({
      label: 'Order',
      defaultValue: '100',
    }),
  } satisfies Fields,
}
export type DocsMetaData = InferSectionData<typeof blogMetaSection.fields>
