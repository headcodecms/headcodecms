import { Container } from '@/components/headcode/themes/vienna/container'
import { Features } from '@/components/headcode/themes/vienna/features'
import { Hero } from '@/components/headcode/themes/vienna/hero'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text } from '@/components/headcode/themes/vienna/text'
import {
  defaultFeatures,
  defaultHero,
  defaultText,
} from '@/components/headcode/themes/vienna/defaults'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'

export default async function Home() {
  'use cache'
  cacheTag('/headcode/entries/global/home')

  const sections = await getSections('global', 'home')

  if (sections.length === 0) {
    return (
      <>
        <Container className="py-8 lg:py-16">
          <Hero sectionData={defaultHero} />
        </Container>
        <Container className="py-8 lg:py-16">
          <Features sectionData={defaultFeatures} />
        </Container>
        <Container className="py-8 lg:py-16">
          <Text sectionData={defaultText} />
        </Container>
      </>
    )
  }

  return sections.map((section) => (
    <Fragment key={section.id}>
      {section.name === 'hero' && (
        <Container className="py-8 lg:py-16">
          <Hero sectionData={section.data} />
        </Container>
      )}
      {section.name === 'features' && (
        <Container className="py-8 lg:py-16">
          <Features sectionData={section.data} />
        </Container>
      )}
      {section.name === 'text' && (
        <Container className="py-8 lg:py-16">
          <Text sectionData={section.data} />
        </Container>
      )}
      {section.name === 'image' && (
        <div className="py-4 lg:py-8">
          <div className="mx-auto sm:max-w-7xl sm:px-6">
            <div className="flex justify-center">
              <SingleImage sectionData={section.data} />
            </div>
          </div>
        </div>
      )}
    </Fragment>
  ))
}
