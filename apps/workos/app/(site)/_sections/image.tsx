import type { ImageData, ImageTextData } from '@/headcode/sections'
import { cn } from '@/lib/utils'
import { Container } from '../_components/container'
import {
  compactMarkdown,
  markdownLink,
  type RenderableImage,
  type SectionProps,
  Visual,
} from './utils'

export const ImageSection = ({
  data,
  headcode,
}: SectionProps<Partial<ImageData> | undefined>) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container>
      <Visual image={(data?.image ?? null) as RenderableImage} wide />
      {data?.caption ? (
        <p className="text-muted-foreground mt-3 text-center text-sm">
          {data.caption}
        </p>
      ) : null}
    </Container>
  </section>
)

export const ImageWithText = ({
  data,
  actions,
  headcode,
}: SectionProps<ImageTextData> & { actions?: React.ReactNode }) => (
  <div
    className={cn(
      'grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16',
      data.reversed && 'md:[&>div:first-child]:order-2',
    )}
    data-headcode={headcode}
  >
    <Visual image={data.image as RenderableImage} />
    <div className="flex flex-col gap-3">
      <span className="text-muted-foreground font-mono text-xs font-medium tracking-widest uppercase">
        {data.eyebrow}
      </span>
      <h3 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
        {data.title}
      </h3>
      <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
        {data.description}
      </p>
      {actions ? (
        <div className="mt-2 flex flex-wrap gap-3">{actions}</div>
      ) : null}
    </div>
  </div>
)

export const renderImageMarkdown = (data: ImageData) => {
  const image = data.image as RenderableImage
  return compactMarkdown([
    image?.src ? `![${image.alt}](${image.src})` : null,
    data.caption,
    image?.src
      ? `Image URL: ${markdownLink(image.alt || 'Image', image.src)}`
      : null,
  ])
}

export const renderImageTextMarkdown = (data: ImageTextData) => {
  const image = data.image as RenderableImage
  return compactMarkdown([
    `## ${data.title}`,
    data.description,
    image?.src
      ? `Image: ${markdownLink(image.alt || data.title, image.src)}`
      : null,
    data.action?.title
      ? markdownLink(data.action.title, data.action.url)
      : null,
  ])
}
