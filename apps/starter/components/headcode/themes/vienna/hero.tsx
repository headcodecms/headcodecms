import { LinkField } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { ALink } from '../../links'

export const heroSection = {
  name: 'hero',
  label: 'Hero Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    subtitle: TextareaField({
      label: 'Subtitle',
    }),
    primaryButton: LinkField({
      label: 'Primary Button',
    }),
    secondaryButton: LinkField({
      label: 'Secondary Button',
    }),
  } satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>

export function Hero({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(heroSection.fields, sectionData)

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="mb-0 text-6xl font-medium text-balance md:text-7xl xl:text-[5.25rem]">
        {data.title}
      </h1>
      <p className="text-muted-foreground mt-0 mb-0 text-lg text-balance">
        {data.subtitle}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild>
          <ALink link={data.primaryButton} />
        </Button>
        <Button asChild variant="outline">
          <ALink link={data.secondaryButton} />
        </Button>
      </div>
    </div>
  )
}
