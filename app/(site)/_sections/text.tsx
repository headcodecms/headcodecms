import type { TextData } from '@/headcode/sections'
import { Container } from '../_components/container'
import { Markdown } from '../_components/markdown'

export const TextSection = ({
  data,
  headcode,
}: {
  data: TextData
  headcode?: string
}) => (
  <section className="pb-20 md:pb-28" data-headcode={headcode}>
    <Container>
      <Markdown content={data.content} />
    </Container>
  </section>
)

export const renderTextMarkdown = (data: TextData) => data.content
