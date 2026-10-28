import type { HeroData, ImageTextData } from '@/headcode/sections'
import type { ServiceEntry, ServiceSection } from '@/headcode/types'
import { Container } from '../_components/container'
import { getDataHeadcodeAttribute } from '../_lib/headcode'
import {
  CodeSection,
  renderCodeMarkdown,
  renderSnippetMarkdown,
  SnippetSection,
  TextSection,
} from './docs'
import { Hero, HeroActions, renderHeroMarkdown } from './hero'
import {
  ImageSection,
  ImageWithText,
  renderImageMarkdown,
  renderImageTextMarkdown,
} from './image'
import { LogoList, renderLogosMarkdown } from './logos'
import { PlansSection, renderPlansMarkdown } from './plans'
import type { SectionProps } from './utils'

export { Hero } from './hero'
export { ImageSection, ImageWithText } from './image'

const components: Record<string, React.FC<SectionProps<never>>> = {
  logos: LogoList,
  image: ImageSection,
  text: TextSection,
  plans: PlansSection,
  snippet: SnippetSection,
  code: CodeSection,
}

const markdownRenderers: Record<string, (data: never) => string> = {
  'image-text': renderImageTextMarkdown,
  logos: renderLogosMarkdown,
  image: renderImageMarkdown,
  text: (data: { content: string }) => data.content,
  plans: renderPlansMarkdown,
  snippet: renderSnippetMarkdown,
  code: renderCodeMarkdown,
}

// Consecutive image-text sections share one wrapping <section>.
const groupSections = (sections: ServiceSection[]) =>
  sections.reduce<ServiceSection[][]>((groups, section) => {
    const last = groups.at(-1)
    if (section.name === 'image-text' && last?.[0].name === 'image-text') {
      last.push(section)
    } else groups.push([section])
    return groups
  }, [])

export const RenderSections = ({
  entry,
  sections,
  showHeroActions = false,
}: {
  entry: ServiceEntry
  sections: ServiceSection[]
  showHeroActions?: boolean
}) =>
  groupSections(sections).map((group) => {
    const [section] = group
    const key = String(section._id)
    const headcode = getDataHeadcodeAttribute(entry, section)
    const data = section.data as never

    if (section.name === 'image-text') {
      return (
        <section key={key} className="py-20 md:py-28">
          <Container className="flex flex-col gap-20 md:gap-28">
            {group.map((item) => (
              <ImageWithText
                key={String(item._id)}
                data={item.data as ImageTextData}
                headcode={getDataHeadcodeAttribute(entry, item)}
              />
            ))}
          </Container>
        </section>
      )
    }
    if (section.name === 'meta' || section.name === 'blog-meta') {
      return <span key={key} hidden data-headcode={headcode} />
    }
    if (section.name === 'hero') {
      return (
        <Hero
          key={key}
          {...(data as HeroData)}
          headcode={headcode}
          actions={showHeroActions ? <HeroActions data={data} /> : null}
        />
      )
    }
    const Section = components[section.name]
    return Section ? (
      <Section key={key} data={data} headcode={headcode} />
    ) : null
  })

export const renderSectionsMarkdown = (
  sections: ServiceSection[],
  showHeroActions = false,
) =>
  sections
    .map((section) =>
      section.name === 'hero'
        ? renderHeroMarkdown(section.data as HeroData, showHeroActions)
        : (markdownRenderers[section.name]?.(section.data as never) ?? ''),
    )
    .map((markdown) => markdown.trim())
    .filter(Boolean)
    .join('\n\n')
    .concat('\n')
