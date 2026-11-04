import { ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { HeroData } from '@/headcode/sections'
import { Container } from '../_components/container'
import { siteIcons } from '../_components/icons'
import { compactMarkdown, markdownLink } from './utils'

export const Hero = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  meta,
  actions,
  headcode,
}: Partial<HeroData> & {
  title: string
  meta?: React.ReactNode
  actions?: React.ReactNode
  headcode?: string
}) => {
  const Icon = eyebrowIcon ? siteIcons[eyebrowIcon] : null
  return (
    <section className="py-20 md:py-28" data-headcode={headcode}>
      <Container>
        <div className="flex flex-col items-start gap-6 text-left">
          {eyebrow ? (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium">
              {Icon ? <Icon className="size-3" /> : null}
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

export const HeroActions = ({
  data: { primaryButton: primary, secondaryButton: secondary },
}: {
  data: HeroData
}) => (
  <>
    {primary?.title ? (
      <Button
        size="lg"
        className="gap-2"
        nativeButton={false}
        render={<Link href={primary.url} />}
      >
        {primary.title}
        <ArrowRight className="size-4" />
      </Button>
    ) : null}
    {secondary?.title ? (
      <Button
        size="lg"
        variant="outline"
        className="gap-2"
        nativeButton={false}
        render={<Link href={secondary.url} />}
      >
        <PlayCircle className="size-4" />
        {secondary.title}
      </Button>
    ) : null}
  </>
)

export const renderHeroMarkdown = (data: HeroData, showActions: boolean) =>
  compactMarkdown([
    `# ${data.title}`,
    data.description,
    showActions
      ? [data.primaryButton, data.secondaryButton]
          .flatMap((button) =>
            button?.title ? [markdownLink(button.title, button.url)] : [],
          )
          .join(' | ')
      : null,
  ])
