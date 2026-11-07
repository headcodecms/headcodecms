import { ImageIcon } from 'lucide-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { Container } from '../_components/container'

export type SectionProps<TData> = { data: TData; headcode?: string }

export type RenderableImage = {
  src: string
  alt: string
  blurDataURL?: string | null
} | null

export const markdownLink = (title: string, url: string) =>
  `[${title.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')}](${url})`

export const compactMarkdown = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('\n\n')

export const Visual = ({
  image,
  wide = false,
}: {
  image?: RenderableImage
  wide?: boolean
}) => (
  <div
    className={cn(
      'bg-muted relative w-full overflow-hidden rounded-xl border',
      wide ? 'aspect-[16/7] rounded-2xl' : 'aspect-video',
    )}
    aria-hidden={image?.src ? undefined : 'true'}
  >
    {image?.src ? (
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
    ) : (
      <>
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
      </>
    )}
  </div>
)

export const DocsBlock = ({
  data,
  headcode,
  children,
}: SectionProps<{ title: string; description: string }> & {
  children: React.ReactNode
}) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {data.title}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed md:text-lg">
          {data.description}
        </p>
      </div>
      {children}
    </Container>
  </section>
)
