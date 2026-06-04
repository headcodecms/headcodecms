import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Container } from '../_components/container'
import type { RenderableImage } from './types'

export const markdownEscape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')

export const markdownLink = (title: string, url: string) =>
  `[${markdownEscape(title)}](${url})`

export const compactMarkdown = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n')

export const markdownList = (items: string[]) =>
  items.map((item) => `- ${item}`).join('\n')

export const technologyPaths: Record<string, string> = {
  'Next.js':
    'M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z',
  Vercel: 'm12 1.608 12 20.784H0Z',
  Convex:
    'M15.09 18.916c3.488-.387 6.776-2.246 8.586-5.348-.857 7.673-9.247 12.522-16.095 9.545a3.47 3.47 0 0 1-1.547-1.314c-1.539-2.417-2.044-5.492-1.318-8.282 2.077 3.584 6.3 5.78 10.374 5.399m-10.501-7.65c-1.414 3.266-1.475 7.092.258 10.24-6.1-4.59-6.033-14.41-.074-18.953a3.44 3.44 0 0 1 1.893-.707c2.825-.15 5.695.942 7.708 2.977-4.09.04-8.073 2.66-9.785 6.442m11.757-5.437C14.283 2.951 11.053.992 7.515.933c6.84-3.105 15.253 1.929 16.17 9.37a3.6 3.6 0 0 1-.334 2.02c-1.278 2.594-3.647 4.607-6.416 5.352 2.029-3.763 1.778-8.36-.589-11.847',
  'shadcn/ui':
    'M22.219 11.784 11.784 22.219c-.407.407-.407 1.068 0 1.476.407.407 1.068.407 1.476 0L23.695 13.26c.407-.408.407-1.069 0-1.476-.408-.407-1.069-.407-1.476 0ZM20.132.305.305 20.132c-.407.407-.407 1.068 0 1.476.408.407 1.069.407 1.476 0L21.608 1.781c.407-.407.407-1.068 0-1.476-.408-.407-1.069-.407-1.476 0Z',
}

export const Visual = ({
  image,
  wide = false,
}: {
  image?: RenderableImage
  wide?: boolean
}) => {
  const className = cn(
    'bg-muted relative w-full overflow-hidden rounded-xl border',
    wide ? 'aspect-[16/7] rounded-2xl' : 'aspect-video',
  )

  if (!image?.src) {
    return (
      <div className={className} aria-hidden="true">
        <div
          className={cn(
            'via-muted absolute inset-0',
            wide
              ? 'from-primary/15 to-background bg-gradient-to-tr'
              : 'from-primary/10 to-muted bg-gradient-to-br',
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon
            className={cn(
              'text-muted-foreground',
              wide ? 'size-20' : 'size-14',
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Image
        src={image.src}
        alt={image.alt ?? ''}
        fill
        sizes={
          wide
            ? '(min-width: 1280px) 80rem, 100vw'
            : '(min-width: 768px) 50vw, 100vw'
        }
        className="object-cover"
        placeholder={image.blurDataURL ? 'blur' : undefined}
        blurDataURL={image.blurDataURL ?? undefined}
      />
    </div>
  )
}

export const DocsBlock = ({
  title,
  description,
  children,
  headcode,
}: {
  title: string
  description: string
  children: React.ReactNode
  headcode?: string
}) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed md:text-lg">
          {description}
        </p>
      </div>
      {children}
    </Container>
  </section>
)
