import { Container } from '@/components/headcode/themes/vienna/container'
import { Hero, HeroData } from '@/components/headcode/themes/custom/hero'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text, TextData } from '@/components/headcode/themes/vienna/text'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'

export default function Community() {
  return <CommunitySection />
}

async function CommunitySection() {
  'use cache'
  cacheTag('/headcode/entries/global/community')

  const sections = await getSections('global', 'community')

  if (sections.length === 0) {
    return (
      <>
        <Container className="py-8 lg:pt-16">
          <Hero sectionData={defaultHero} />
        </Container>
        <Container className="py-8">
          <Text sectionData={defaultText} />
        </Container>
      </>
    )
  }

  return sections.map((section) => (
    <Fragment key={section.id}>
      {section.name === 'hero' && (
        <Container className="py-8 lg:pt-16">
          <Hero sectionData={section.data} />
        </Container>
      )}
      {section.name === 'text' && (
        <Container className="py-8">
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

const defaultHero: HeroData = {
  title: 'Community',
  features: [],
  snippets: [],
  snippetsSublines: [],
  databases: [],
  storages: [],
  auths: [],
  primaryButton: {
    title: '',
    url: '',
    openInNewWindow: false,
  },
}

const defaultText: TextData = {
  text: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          },
        ],
      },
    ],
  },
}
