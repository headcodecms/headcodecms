import { Container } from '@/components/headcode/themes/vienna/container'
import {
  Features,
  FeaturesData,
} from '@/components/headcode/themes/vienna/features'
import { Hero, HeroData } from '@/components/headcode/themes/vienna/hero'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text, TextData } from '@/components/headcode/themes/vienna/text'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'

export default function Home() {
  return <HomeSection />
}

async function HomeSection() {
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

const defaultHero: HeroData = {
  title: 'Welcome to Headcode CMS',
  subtitle:
    'A minimalistic web content management system for Next.js. Start with editing content in the Headcode Admin.',
  primaryButton: {
    title: 'Headcode Admin',
    url: '/headcode',
    openInNewWindow: false,
  },
  secondaryButton: {
    title: 'Documentation',
    url: 'https://headcodecms.com/docs',
    openInNewWindow: true,
  },
}

const defaultFeatures: FeaturesData = {
  title: 'Features',
  subtitle:
    'A minimalistic web content management system for Next.js. Start with editing content in the Headcode Admin.',
  tagline: 'Features',
  features: [
    {
      title: 'Feature 1',
      description:
        'Feature 1 lorem ipsum dolor sit amet. Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      icon: 'cloud',
      link: {
        title: 'Feature 1',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      title: 'Feature 2',
      description:
        'Feature 2 lorem ipsum dolor sit amet. Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      icon: 'refresh',
      link: {
        title: 'Feature 2',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      title: 'Feature 3',
      description:
        'Feature 3 lorem ipsum dolor sit amet. Consectetur adipiscing elit.',
      icon: 'settings',
      link: {
        title: 'Feature 3',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
  ],
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
