import { LinkField } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { ALink } from '@/components/headcode/links'
import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { CircleCheckBigIcon } from 'lucide-react'
import Commands from './commands'
import { SwitchField } from '../../form/switch-field'
import { cn } from '@/lib/utils'

export const heroSection = {
  name: 'hero',
  label: 'Hero Section',
  fields: {
    title: TextField({
      label: 'Title',
    }),
    features: {
      label: 'Features',
      fields: {
        title: TextField({
          label: 'Title',
        }),
      },
    },
    snippets: {
      label: 'Snippets',
      fields: {
        title: TextField({
          label: 'Title',
        }),
        code: TextareaField({
          label: 'Code',
        }),
      },
    },
    snippetsSublines: {
      label: 'Snippets Sublines',
      fields: {
        line: TextField({
          label: 'Line',
        }),
      },
    },

    databases: {
      label: 'Databases',
      fields: {
        name: TextField({
          label: 'Name',
        }),
        available: SwitchField({
          label: 'Available',
          defaultValue: true,
        }),
      },
    },

    storages: {
      label: 'Storages',
      fields: {
        name: TextField({
          label: 'Name',
        }),
        available: SwitchField({
          label: 'Available',
          defaultValue: true,
        }),
      },
    },

    auths: {
      label: 'Auths',
      fields: {
        name: TextField({
          label: 'Name',
        }),
        available: SwitchField({
          label: 'Available',
          defaultValue: true,
        }),
      },
    },

    primaryButton: LinkField({
      label: 'Primary Button',
    }),
  } satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>
type SupportCategoryItem = HeroData['databases'][number]

export function Hero({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(heroSection.fields, sectionData)

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="mb-0 text-5xl font-extrabold tracking-tight lg:text-6xl">
        {data.title}
      </h1>

      {data.features.length > 0 && (
        <ul className="text-muted-foreground flex max-w-lg flex-col justify-start gap-2 md:text-lg lg:text-xl">
          {data.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CircleCheckBigIcon className="mt-1 size-5 flex-none" />
              {feature.title}
            </li>
          ))}
        </ul>
      )}

      {data.snippets.length > 0 && (
        <div className="w-3xl max-w-full">
          <Commands snippets={data.snippets} />
        </div>
      )}

      {data.snippetsSublines.length > 0 && (
        <div className="text-muted-foreground -mt-4 text-sm">
          <div className="text-center">
            {data.snippetsSublines.map((subline, index) => (
              <p key={index}>{subline.line}</p>
            ))}
          </div>
        </div>
      )}

      {(data.databases.length > 0 ||
        data.storages.length > 0 ||
        data.auths.length > 0) && (
        <div className="mx-auto w-full max-w-3xl">
          <h3 className="text-center text-2xl font-medium">Supports</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <SupportCategory title="Database" items={data.databases} />
            <SupportCategory title="Storage" items={data.storages} />
            <SupportCategory title="Auth" items={data.auths} />
          </div>
        </div>
      )}

      {data.primaryButton.title.length > 0 && (
        <div className="flex items-center gap-2">
          <Button asChild>
            <ALink link={data.primaryButton} />
          </Button>
        </div>
      )}
    </div>
  )
}

type SupportCategoryProps = {
  title: string
  items: Array<SupportCategoryItem>
}

function SupportCategory({ title, items }: SupportCategoryProps) {
  return (
    <div className="bg-muted rounded-lg p-4">
      <h4 className="text-lg font-medium lg:text-center">{title}</h4>
      <ul className="text-muted-foreground mt-2 flex w-full flex-col justify-start gap-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <CircleCheckBigIcon
              className={cn(
                'mt-1 size-4 flex-none',
                !item.available && 'opacity-0',
              )}
            />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
