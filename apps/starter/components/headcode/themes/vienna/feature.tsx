import { EditorField } from '@/components/headcode/form/editor-field'
import { ImageField } from '@/components/headcode/form/image-field'
import { LinkField } from '@/components/headcode/form/link-field'
import { SwitchField } from '@/components/headcode/form/switch-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { isEmpty } from '@/lib/headcode/utils'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ALink } from '../../links'
import { JSONContent, render } from '../../form/editor-field-renderer'
import { Separator } from '@/components/ui/separator'

export const featureSection = {
  name: 'feature',
  label: 'Feature Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    subtitle: TextareaField({
      label: 'Subtitle',
    }),
    tagline: TextField({
      label: 'Tagline',
    }),
    description: EditorField({
      label: 'Description',
    }),
    link: LinkField({
      label: 'Call to Action',
    }),
    image: ImageField({
      label: 'Image',
    }),
    imageRight: SwitchField({
      label: 'Image on Right',
    }),
  } satisfies Fields,
}
export type FeatureData = InferSectionData<typeof featureSection.fields>

export function Feature({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(featureSection.fields, sectionData)

  return (
    <div
      className={cn(
        'grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16',
        data.imageRight && 'lg:[&>*:first-child]:order-2',
      )}
    >
      {/* Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl">
        {data.image ? (
          <Image
            src={data.image.src}
            alt={data.image.alt}
            width={data.image.width}
            height={data.image.height}
            className="h-full w-full object-cover"
            blurDataURL={data.image.blurDataURL || undefined}
            placeholder={data.image.blurDataURL ? 'blur' : undefined}
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {!isEmpty(data.tagline) && (
          <p className="text-accent-foreground text-sm font-semibold tracking-wide">
            {data.tagline}
          </p>
        )}
        {!isEmpty(data.title) && (
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.title}
          </h2>
        )}
        {!isEmpty(data.subtitle) && (
          <>
            <p className="text-oreground text-lg">{data.subtitle}</p>
            <Separator />
          </>
        )}
        {data.description && (
          <div className="typography text-muted-foreground">
            {render(data.description as JSONContent)}
          </div>
        )}
        {!isEmpty(data.link.title) && (
          <div className="mt-4">
            <Button asChild>
              <ALink link={data.link} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
