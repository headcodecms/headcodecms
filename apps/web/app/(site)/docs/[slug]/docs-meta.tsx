import { SelectField } from '@/components/headcode/form/select-field'
import { TextField } from '@/components/headcode/form/text-field'
import type { Fields, InferSectionData } from '@/lib/headcode/types'

export const docsMetaSection = {
  name: 'docs-meta',
  label: 'Docs Meta Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    group: SelectField({
      label: 'Group',
      options: [
        { label: 'Overview', value: 'overview' },
        { label: 'Themes', value: 'themes' },
        { label: 'Admin', value: 'admin' },
        { label: 'Fields', value: 'fields' },
        { label: 'Database', value: 'database' },
        { label: 'Storage', value: 'storage' },
        { label: 'Auth', value: 'auth' },
      ],
    }),
    order: TextField({
      label: 'Order',
      defaultValue: '100',
    }),
  } satisfies Fields,
}
export type DocsMetaData = InferSectionData<typeof docsMetaSection.fields>
