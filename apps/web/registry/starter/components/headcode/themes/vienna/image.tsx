import { ImageField } from '@/components/headcode/form/image-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import Image from 'next/image'

export const imageSection = {
  name: 'image',
  label: 'Image Section',
  fields: {
    image: ImageField({
      label: 'Image',
    }),
  } satisfies Fields,
}
export type ImageData = InferSectionData<typeof imageSection.fields>

export function SingleImage({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(imageSection.fields, sectionData)

  return data.image ? <Image {...data.image} alt={data.image.alt} /> : null
}
