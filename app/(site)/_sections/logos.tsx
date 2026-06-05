import type { LogosData } from '@/headcode/sections'
import { Container } from '../_components/container'
import { markdownList, technologyPaths } from './render-utils'

export const LogoList = ({
  data,
  headcode,
}: {
  data: LogosData
  headcode?: string
}) => (
  <section className="border-y py-10" data-headcode={headcode}>
    <Container>
      {data.eyebrow ? (
        <p className="text-muted-foreground mb-6 text-center font-mono text-xs tracking-widest uppercase">
          {data.eyebrow}
        </p>
      ) : null}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
        {data.items.map((item) => {
          const path = item.iconPath || technologyPaths[item.name]
          return (
            <li
              key={item.name}
              className="text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-2 transition-colors"
            >
              {path ? (
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 fill-current"
                  aria-hidden="true"
                >
                  <path d={path} />
                </svg>
              ) : null}
              <span className="font-heading text-sm font-semibold tracking-tight">
                {item.name}
              </span>
            </li>
          )
        })}
      </ul>
    </Container>
  </section>
)

export const renderLogosMarkdown = (data: LogosData) =>
  [
    `## ${data.eyebrow || 'Built with'}`,
    markdownList(data.items.map((item) => item.name)),
  ]
    .filter(Boolean)
    .join('\n\n')
