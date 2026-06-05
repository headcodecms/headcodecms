import * as React from 'react'

import type {
  CodeData,
  HeroData,
  ImageData as ImageSectionData,
  ImageTextData,
  LogosData,
  PlansData,
  SnippetData,
  TextData,
} from '@/headcode/sections'
import { getDataHeadcodeAttribute } from '@/headcode/utils'
import type { ServiceEntry, ServiceSection } from '@/headcode/types'
import { Container } from '../_components/container'
import { CodeSection, renderCodeMarkdown } from './code'
import { Hero, HeroActions, renderHeroMarkdown } from './hero'
import { ImageSection, renderImageMarkdown } from './image'
import { ImageWithText, renderImageTextMarkdown } from './image-text'
import { LogoList, renderLogosMarkdown } from './logos'
import { PlansSection, renderPlansMarkdown } from './plans'
import { SnippetSection, renderSnippetMarkdown } from './snippet'
import { TextSection, renderTextMarkdown } from './text'
import type { RenderSectionsProps } from './types'

export { Hero, HeroActions } from './hero'
export { ImageSection } from './image'
export { ImageWithText } from './image-text'

const renderImageTextGroup = (
  entry: ServiceEntry,
  sections: ServiceSection[],
) => (
  <section
    key={`image-text-${String(sections[0]?._id ?? 'group')}`}
    className="py-20 md:py-28"
  >
    <Container className="flex flex-col gap-20 md:gap-28">
      {sections.map((item) => (
        <ImageWithText
          key={String(item._id)}
          data={item.data as ImageTextData}
          headcode={getDataHeadcodeAttribute(entry, item)}
        />
      ))}
    </Container>
  </section>
)

export const RenderSections = ({
  entry,
  sections,
  showHeroActions = false,
}: RenderSectionsProps) => {
  const renderedSections: React.ReactNode[] = []

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index]
    if (!section) continue
    const headcode = getDataHeadcodeAttribute(entry, section)

    if (section.name === 'image-text') {
      const imageTextSections = [section]
      while (sections[index + 1]?.name === 'image-text') {
        index++
        const nextSection = sections[index]
        if (nextSection) imageTextSections.push(nextSection)
      }

      renderedSections.push(renderImageTextGroup(entry, imageTextSections))
      continue
    }

    renderedSections.push(
      (() => {
        if (section.name === 'meta' || section.name === 'blog-meta') {
          return (
            <span key={String(section._id)} hidden data-headcode={headcode} />
          )
        }
        if (section.name === 'hero') {
          const data = section.data as HeroData
          return (
            <Hero
              key={String(section._id)}
              {...data}
              headcode={headcode}
              actions={showHeroActions ? <HeroActions data={data} /> : null}
            />
          )
        }
        if (section.name === 'logos') {
          return (
            <LogoList
              key={String(section._id)}
              data={section.data as LogosData}
              headcode={headcode}
            />
          )
        }
        if (section.name === 'image') {
          return (
            <ImageSection
              key={String(section._id)}
              data={section.data as ImageSectionData}
              headcode={headcode}
            />
          )
        }
        if (section.name === 'text') {
          return (
            <TextSection
              key={String(section._id)}
              data={section.data as TextData}
              headcode={headcode}
            />
          )
        }
        if (section.name === 'plans') {
          return (
            <PlansSection
              key={String(section._id)}
              data={section.data as PlansData}
              headcode={headcode}
            />
          )
        }
        if (section.name === 'snippet') {
          return (
            <SnippetSection
              key={String(section._id)}
              data={section.data as SnippetData}
              headcode={headcode}
            />
          )
        }
        if (section.name === 'code') {
          return (
            <CodeSection
              key={String(section._id)}
              data={section.data as CodeData}
              headcode={headcode}
            />
          )
        }

        return <React.Fragment key={`${section.name}-${index}`} />
      })(),
    )
  }

  return <>{renderedSections}</>
}

export const renderSectionsMarkdown = ({
  sections,
  showHeroActions = false,
}: RenderSectionsProps) => {
  const renderedSections: string[] = []

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index]
    if (!section) continue

    if (section.name === 'meta' || section.name === 'blog-meta') continue

    if (section.name === 'image-text') {
      const imageTextSections = [section]
      while (sections[index + 1]?.name === 'image-text') {
        index++
        const nextSection = sections[index]
        if (nextSection) imageTextSections.push(nextSection)
      }

      renderedSections.push(
        imageTextSections
          .map((item) => renderImageTextMarkdown(item.data as ImageTextData))
          .join('\n\n'),
      )
      continue
    }

    if (section.name === 'hero') {
      renderedSections.push(
        renderHeroMarkdown(section.data as HeroData, {
          showActions: showHeroActions,
        }),
      )
    } else if (section.name === 'logos') {
      renderedSections.push(renderLogosMarkdown(section.data as LogosData))
    } else if (section.name === 'image') {
      renderedSections.push(
        renderImageMarkdown(section.data as ImageSectionData),
      )
    } else if (section.name === 'text') {
      renderedSections.push(renderTextMarkdown(section.data as TextData))
    } else if (section.name === 'plans') {
      renderedSections.push(renderPlansMarkdown(section.data as PlansData))
    } else if (section.name === 'snippet') {
      renderedSections.push(renderSnippetMarkdown(section.data as SnippetData))
    } else if (section.name === 'code') {
      renderedSections.push(renderCodeMarkdown(section.data as CodeData))
    }
  }

  return renderedSections
    .map((section) => section.trim())
    .filter(Boolean)
    .join('\n\n')
    .concat('\n')
}
