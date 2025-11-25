import { Container } from '@/components/headcode/themes/vienna/container'
import {
  Features,
  FeaturesData,
} from '@/components/headcode/themes/vienna/features'
import { Footer, FooterData } from '@/components/headcode/themes/vienna/footer'
import { Header, HeaderData } from '@/components/headcode/themes/vienna/header'
import { Hero, HeroData } from '@/components/headcode/themes/vienna/hero'
import { Figure } from '@/components/headcode/themes/vienna/image'
import { Text, TextData } from '@/components/headcode/themes/vienna/text'
import { getSection, getSections } from '@/lib/headcode'
import DefaultLogo from '@/public/headcode-logo.svg'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'

export default function Home() {
  return (
    <>
      <HeaderSection />
      <HomeSection />
      <FooterSection />
    </>
  )
}

async function HeaderSection() {
  'use cache'
  cacheTag('/headcode/entries/global/header')

  const section = await getSection('global', 'header', 'header')
  return (
    <Container className="py-8">
      <Header sectionData={section ? section.data : defaultHeader} />
    </Container>
  )
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
              <Figure sectionData={section.data} />
            </div>
          </div>
        </div>
      )}
    </Fragment>
  ))
}

async function FooterSection() {
  'use cache'
  cacheTag('/headcode/entries/global/footer')

  const section = await getSection('global', 'footer', 'footer')
  return (
    <Container className="bg-muted text-muted-foreground py-8">
      <Footer sectionData={section ? section.data : defaultFooter} />
    </Container>
  )
}

const defaultHeader: HeaderData = {
  logo: DefaultLogo,
  name: 'Headcode CMS',
  nav: [
    {
      link: {
        title: 'headcodecms.com',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Admin',
        url: '/headcode',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Docs',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
    },
  ],
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

const defaultFooter: FooterData = {
  company: '© 2026 Headcode CMS. All rights reserved.',
  nav: [
    {
      link: {
        title: 'Website',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
    },
    {
      link: {
        title: 'Docs',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
    },
  ],
  social: [
    {
      link: {
        title: 'Facebook',
        url: 'https://headcodecms.com',
        openInNewWindow: true,
      },
      icon: 'facebook',
    },
    {
      link: {
        title: 'Instagram',
        url: 'https://headcodecms.com/docs',
        openInNewWindow: true,
      },
      icon: 'instagram',
    },
  ],
}
