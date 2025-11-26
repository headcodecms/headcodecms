import { LinkField } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { TextareaField } from '@/components/headcode/form/textarea-field'
import { ALink } from '@/components/headcode/links'
import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import { CircleCheckBigIcon } from 'lucide-react'
import Snippets from '../snippets'

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
    primaryButton: LinkField({
      label: 'Primary Button',
    }),
  } satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>

export function Hero({ sectionData }: { sectionData: unknown }) {
  const { data } = parseSectionData(heroSection.fields, sectionData)

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="mb-0 text-5xl font-medium text-balance xl:text-6xl">
        {data.title}
      </h1>
      <ul className="text-muted-foreground flex max-w-lg flex-col justify-start gap-2 md:text-lg lg:text-xl">
        {data.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CircleCheckBigIcon className="mt-1 size-5 flex-none" />
            {feature.title}
          </li>
        ))}
      </ul>

      <div className="w-3xl max-w-full">
        <Snippets snippets={data.snippets} />
      </div>

      <div className="text-muted-foreground -mt-4 text-sm">
        <p className="text-center">
          Default: SQLite (file), Better Auth, file storage
          <br />
          Best for local dev and tryout - no SAAS services required.
        </p>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <h3 className="text-center text-2xl font-medium">Supports</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-lg font-medium lg:text-center">Database</h4>
            <ul className="text-muted-foreground mt-2 flex w-full flex-col justify-start gap-1">
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none" />
                SQLite
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none" />
                Turso Cloud
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none opacity-0" />
                Postgres (soon)
              </li>
            </ul>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-lg font-medium lg:text-center">Storage</h4>
            <ul className="text-muted-foreground mt-2 flex w-full flex-col justify-start gap-1">
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none" />
                File Storage
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none" />
                Vercel BLOB
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none opacity-0" />
                Uploadthing (soon)
              </li>
            </ul>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <h4 className="text-lg font-medium lg:text-center">Auth</h4>
            <ul className="text-muted-foreground mt-2 flex w-full flex-col justify-start gap-1">
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none" />
                Better Auth
              </li>
              <li className="flex items-start gap-2">
                <CircleCheckBigIcon className="mt-1 size-4 flex-none opacity-0" />
                Clerk (soon)
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild>
          <ALink link={data.primaryButton} />
        </Button>
      </div>
    </div>
  )
}
