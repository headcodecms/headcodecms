import type { ImageTextData } from '@/headcode/sections'
import { cn } from '@/lib/utils'
import { compactMarkdown, markdownLink, Visual } from './render-utils'
import type { RenderableImage } from './types'

export const ImageWithText = ({
  data,
  actions,
  headcode,
}: {
  data: ImageTextData
  actions?: React.ReactNode
  headcode?: string
}) => {
  const image = data.image as RenderableImage

  return (
    <div
      className={cn(
        'grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16',
        data.reversed && 'md:[&>div:first-child]:order-2',
      )}
      data-headcode={headcode}
    >
      <Visual image={image} />
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
