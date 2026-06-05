import type { ImageData } from '@/headcode/sections'
import { Container } from '../_components/container'
import type { RenderableImage } from './types'
import { compactMarkdown, markdownLink, Visual } from './render-utils'

export const ImageSection = ({
  data,
  headcode,
}: {
  data?: Partial<ImageData>
  headcode?: string
}) => {
  return (
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
}

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
