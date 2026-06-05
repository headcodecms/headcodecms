import { ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import type { HeroData } from '@/headcode/sections'
import { Container } from '../_components/container'
import { renderSiteIcon } from '../_components/icons'
import { compactMarkdown, markdownLink } from './render-utils'

type HeroProps = Partial<HeroData> & Pick<HeroData, 'title'>

export const Hero = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  meta,
  actions,
  headcode,
}: HeroProps & {
  meta?: React.ReactNode
  actions?: React.ReactNode
  headcode?: string
}) => {
  return (
    <section className="py-20 md:py-28" data-headcode={headcode}>
      <Container>
        <div className="flex flex-col items-start gap-6 text-left">
          {eyebrow ? (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium">
              {renderSiteIcon(eyebrowIcon, 'size-3')}
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-lg md:text-xl">
              {description}
            </p>
          ) : null}
          {meta ? (
            <div className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              {meta}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

export const HeroActions = ({ data }: { data: HeroData }) => (
  <>
    {data.primaryButton?.title ? (
      <Button
        size="lg"
        className="gap-2"
        nativeButton={false}
        render={<Link href={data.primaryButton.url} />}
      >
        {data.primaryButton.title}
        <ArrowRight className="size-4" />
      </Button>
    ) : null}
    {data.secondaryButton?.title ? (
      <Button
        size="lg"
        variant="outline"
        className="gap-2"
        nativeButton={false}
        render={<Link href={data.secondaryButton.url} />}
      >
        <PlayCircle className="size-4" />
        {data.secondaryButton.title}
      </Button>
    ) : null}
  </>
)

export const renderHeroMarkdown = (
  data: HeroData,
  options: { showActions?: boolean } = {},
) =>
  compactMarkdown([
    `# ${data.title}`,
    data.description,
    options.showActions
      ? [
          data.primaryButton?.title
            ? markdownLink(data.primaryButton.title, data.primaryButton.url)
            : null,
          data.secondaryButton?.title
            ? markdownLink(data.secondaryButton.title, data.secondaryButton.url)
            : null,
        ]
          .filter(Boolean)
          .join(' | ')
      : null,
  ])
