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
  { label: 'Destinations', value: 'destinations' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Reflections', value: 'reflections' },
  { label: 'Product Updates', value: 'product-updates' },
  { label: 'Best Practices', value: 'best-practices' },
]

export const blogMetaSection = {
  name: 'blog-meta',
  label: 'Blog Meta',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    description: TextareaField({
      label: 'Description',
    }),
    heroImage: ImageField({
      label: 'Hero Image',
      description: 'Featured image for the blog post',
    }),
    author: TextField({
      label: 'Author Name',
    }),
    authorImage: ImageField({
      label: 'Author Image',
      description: 'Small avatar image for the author',
    }),
    date: DatePickerField({
      label: 'Published Date',
    }),
    category: SelectField({
      label: 'Category',
      options: blogCategoryOptions,
    }),
    featured: SwitchField({
      label: 'Featured Post',
      description: 'Show as featured post',
      defaultValue: false,
    }),
    readTime: TextField({
      label: 'Read Time',
      description: 'e.g. "5 min read"',
      defaultValue: '3 min read',
    }),
  } satisfies Fields,
}

export type BlogMetaData = InferSectionData<typeof blogMetaSection.fields>
