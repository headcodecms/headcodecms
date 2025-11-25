import { Button } from '@/components/ui/button'
import { parseSectionData } from '@/lib/headcode/data'
import type { Fields, InferSectionData, Section } from '@/lib/headcode/types'
import Link from 'next/link'

export const heroSection = {
  name: 'hero',
  label: 'Hero Section',
  fields: {} satisfies Fields,
}
export type HeroData = InferSectionData<typeof heroSection.fields>

export function Hero({ section }: { section: Section }) {
  const { data } = parseSectionData(heroSection.fields, section.data)

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h1 className="mb-0 text-6xl font-medium text-balance md:text-7xl xl:text-[5.25rem]">
        The best way to build your website
      </h1>
      <p className="text-muted-foreground mt-0 mb-0 text-lg text-balance">
        Kibo UI blocks are a new way to build your website. They are a
        collection of pre-built components that you can use to build your
        website.
      </p>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="#">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link className="no-underline" href="#">
            Learn more
          </Link>
        </Button>
      </div>
    </div>
  )
}
