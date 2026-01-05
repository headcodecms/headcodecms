import HeadcodeLogo from '@/public/headcode-logo.svg'
import { ImageField } from '@/components/headcode/form/image-field'
import { LinkField, LinkValue } from '@/components/headcode/form/link-field'
import { TextField } from '@/components/headcode/form/text-field'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData } from '@/lib/headcode/types'
import Image from 'next/image'
import Link from 'next/link'
import { MegaMenu } from './mega-menu'

export const headerMegaSection = {
  name: 'header-mega',
  label: 'Header Mega Section',
  fields: {
    logo: ImageField({
      label: 'Logo',
    }),
    name: TextField({
      label: 'Brand Name',
    }),

    mega1Title: TextField({
      label: 'Mega 1 Title',
    }),
    mega1Image: ImageField({
      label: 'Mega 1 Image',
    }),
    mega1ImageLink: LinkField({
      label: 'Mega 1 Image Link',
    }),
    mega1Links: {
      label: 'Mega 1 Links',
      fields: {
        link: LinkField({
          label: 'Link',
        }),
        description: TextField({
          label: 'Description',
        }),
      },
    },

    mega2Title: TextField({
      label: 'Mega 2 Title',
    }),
    mega2Image: ImageField({
      label: 'Mega 2 Image',
    }),
    mega2ImageLink: LinkField({
      label: 'Mega 2 Image Link',
    }),
    mega2Links: {
      label: 'Mega 2 Links',
      fields: {
        link: LinkField({
          label: 'Link',
        }),
        description: TextField({
          label: 'Description',
        }),
      },
    },
    sections: {
      label: 'Sections',
      fields: {
        link: LinkField({
          label: 'Link',
        }),
      },
    },
  } satisfies Fields,
}
export type HeaderMegaData = InferSectionData<typeof headerMegaSection.fields>

export function HeaderMega({
  sectionData,
  pages,
}: {
  sectionData: unknown
  pages: LinkValue[]
}) {
  const { data } = parseSectionData(headerMegaSection.fields, sectionData)
  const logo = data.logo ? data.logo : HeadcodeLogo

  return (
    <div className="flex items-center justify-between gap-8 md:justify-start">
      <Link href="/" className="flex items-center gap-4 text-2xl font-bold">
        <Image
          className="h-8 w-auto"
          src={logo.src}
          alt={logo.alt || 'Headcode Logo'}
          width={logo.width}
          height={logo.height}
          blurDataURL={logo.blurDataURL || undefined}
        />
        {data.name}
      </Link>

      <MegaMenu data={data} pages={pages} />
    </div>
  )
}
