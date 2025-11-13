import { Entry as DBEntry, Section } from "@/db"

export type Entry = DBEntry & {
  sectionName: string | null
  sectionData: Record<string, any> | null
}
export async function getEntries(namespace: string, sectionName?: string): Promise<Entry[]> {
  // returns all entries for a namespace
  // if sectionName is provided return section data with that name, e.g., docs-meta
  
  return []
}

export async function getSectionsById(entryId: number): Promise<Section[]> {{
  // returns all sections for an entry with the section name
  return []
}

export async function getSections(namespace: string, key: string): Promise<Section[]> {
  // returns all sections for an entry with the section name order by pos
  return []
}

export async function getSectionByName(namespace: string, key: string, sectionName: string): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}>  {
  return null
}

export async function getSection<F extends Fields>(
  id: string,
): Promise<{
  section: InferSectionData<F>
  isDefault: boolean
}> {
  // get from DB by id
  // get section config from config
  // check if name from DB is equal to section.name
  // if not, throw error
  // if equal, parse schema
  const schema = getSchema(sectionConfig.fields)
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

// const heroSection = {
//   name: 'hero',
//   title: 'Hero Section', // label
//   fields: {
//     title: TextField({
//       label: 'Title Mex',
//       description: 'Title description',
//       defaultValue: 'Default Title',
//     }),
//     description: TextareaField({ label: 'Description Mex' }),
//     select: SelectField({
//       label: 'Select Mex',
//       defaultValue: 'option2',
//       options: [
//         { label: 'Option 1', value: 'option1' },
//         { label: 'Option 2', value: 'option2' },
//       ],
//     }),
//     plans: {
//       label: 'Plans',
//       fields: {
//         plan: TextField({
//           label: 'Plan Title',
//           description: 'Plan description',
//           defaultValue: 'Default Plan',
//         }),
//         price: TextField({
//           label: 'Plan Price',
//           description: 'Plan price description',
//           defaultValue: 'Default Price',
//         }),
//       },
//     },
//   } satisfies Fields,
// }
