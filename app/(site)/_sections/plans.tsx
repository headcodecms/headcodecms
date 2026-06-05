import { ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PlansData } from '@/headcode/sections'
import { cn } from '@/lib/utils'
import { Container } from '../_components/container'
import { compactMarkdown, markdownLink } from './render-utils'

type PlanData = PlansData['plans'][number]

export const PlansSection = ({
  data,
  headcode,
}: {
  data: PlansData
  headcode?: string
}) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container>
      <ul className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {data.plans.map((plan) => (
          <li key={plan.name} className="flex">
            <PlanCard plan={plan} />
          </li>
        ))}
      </ul>
      {data.note ? (
        <p className="text-muted-foreground mt-6 text-center text-xs">
          {data.note}
        </p>
      ) : null}
    </Container>
  </section>
)

const PlanCard = ({ plan }: { plan: PlanData }) => (
  <div className="relative flex w-full pt-3">
    {plan.featured ? (
      <span className="bg-foreground text-background absolute top-0 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium tracking-wide uppercase">
        <Sparkles className="size-3" />
        Most popular
      </span>
    ) : null}
    <Card
      className={cn(
        'flex w-full flex-col',
        plan.featured && 'ring-foreground/20 ring-2',
      )}
    >
      <CardHeader>
        <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
            {plan.price}
          </span>
          <span className="text-muted-foreground text-sm">{plan.cadence}</span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li
              key={feature.feature}
              className="flex items-start gap-2.5 text-sm"
            >
              <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <span>{feature.feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Link
          href={plan.cta.url}
          className={cn(
            buttonVariants({
              variant: plan.featured ? 'default' : 'outline',
              size: 'lg',
            }),
            'w-full gap-2',
          )}
        >
          {plan.cta.title}
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  </div>
)

export const renderPlansMarkdown = (data: PlansData) =>
  compactMarkdown([
    '## Plans',
    data.plans
      .map((plan) =>
        compactMarkdown([
          `### ${plan.name}`,
          plan.description,
          `${plan.price}${plan.cadence ? ` ${plan.cadence}` : ''}`,
          plan.features.map((feature) => `- ${feature.feature}`).join('\n'),
          markdownLink(plan.cta.title, plan.cta.url),
        ]),
      )
      .join('\n\n'),
    data.note,
  ])
