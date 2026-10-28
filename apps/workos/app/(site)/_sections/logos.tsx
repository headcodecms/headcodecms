import type { LogosData } from '@/headcode/sections'
import { Container } from '../_components/container'
import type { SectionProps } from './utils'

const technologyPaths: Record<string, string> = {
  'Next.js':
    'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z',
  Vercel: 'm12 1.608 12 20.784H0Z',
  Convex:
    'M15.09 18.916c3.488-.387 6.776-2.246 8.586-5.348-.857 7.673-9.247 12.522-16.095 9.545a3.47 3.47 0 0 1-1.547-1.314c-1.539-2.417-2.044-5.492-1.318-8.282 2.077 3.584 6.3 5.78 10.374 5.399m-10.501-7.65c-1.414 3.266-1.475 7.092.258 10.24-6.1-4.59-6.033-14.41-.074-18.953a3.44 3.44 0 0 1 1.893-.707c2.825-.15 5.695.942 7.708 2.977-4.09.04-8.073 2.66-9.785 6.442m11.757-5.437C14.283 2.951 11.053.992 7.515.933c6.84-3.105 15.253 1.929 16.17 9.37a3.6 3.6 0 0 1-.334 2.02c-1.278 2.594-3.647 4.607-6.416 5.352 2.029-3.763 1.778-8.36-.589-11.847',
  'shadcn/ui':
    'M22.219 11.784 11.784 22.219c-.407.407-.407 1.068 0 1.476.407.407 1.068.407 1.476 0L23.695 13.26c.407-.408.407-1.069 0-1.476-.408-.407-1.069-.407-1.476 0ZM20.132.305.305 20.132c-.407.407-.407 1.068 0 1.476.408.407 1.069.407 1.476 0L21.608 1.781c.407-.407.407-1.068 0-1.476-.408-.407-1.069-.407-1.476 0Z',
}

export const LogoList = ({ data, headcode }: SectionProps<LogosData>) => (
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
    data.items.map((item) => `- ${item.name}`).join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n')
