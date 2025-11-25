import { LinkField } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import {
  CheckIcon,
  CloudIcon,
  HeartIcon,
  RefreshCcwIcon,
  SettingsIcon,
  StarIcon,
} from 'lucide-react'
import { SelectField } from '../../form/select-field'
import { ALink } from '../../links'

export const featuresSection = {
  name: 'features',
  label: 'Features Section',
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
    features: {
      label: 'Features',
      fields: {
        title: TextField({
          label: 'Title',
        }),
        description: TextareaField({
          label: 'Description',
        }),
        icon: SelectField({
          label: 'Icon',
          options: [
            { label: 'Check', value: 'check' },
            { label: 'Star', value: 'star' },
            { label: 'Heart', value: 'heart' },
            { label: 'Refresh', value: 'refresh' },
            { label: 'Settings', value: 'settings' },
            { label: 'Cloud', value: 'cloud' },
          ],
        }),
        link: LinkField({
          label: 'Link',
        }),
      },
    },
  } satisfies Fields,
}
export type FeaturesData = InferSectionData<typeof featuresSection.fields>

export function Features({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(featuresSection.fields, sectionData)

  return (
    <>
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-accent-foreground mb-2 text-base/7 font-semibold">
          {data.tagline}
        </h2>
        <p className="text-4xl font-semibold tracking-tight text-pretty sm:text-5xl lg:text-balance">
          {data.title}
        </p>
        <p className="text-muted-foreground text-lg/8">{data.subtitle}</p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {data.features.map((feature, index) => {
            const Icon = icons[feature.icon as keyof typeof icons]
            return (
              <div key={index} className="flex flex-col">
                <dt className="text-muted-foreground flex items-center gap-x-3 text-base/7 font-semibold">
                  {Icon && (
                    <Icon
                      aria-hidden="true"
                      className="text-accent-foreground size-5 flex-none"
                    />
                  )}
                  {feature.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600 dark:text-gray-400">
                  <p className="flex-auto">{feature.description}</p>
                  <p className="mt-6">
                    <Button variant="secondary" asChild>
                      <ALink link={feature.link} />
                    </Button>
                  </p>
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </>
  )
}

const icons = {
  check: CheckIcon,
  star: StarIcon,
  heart: HeartIcon,
  refresh: RefreshCcwIcon,
  settings: SettingsIcon,
  cloud: CloudIcon,
}
