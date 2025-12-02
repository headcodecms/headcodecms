import { Container } from '@/components/headcode/themes/vienna/container'
import { Features } from '@/components/headcode/themes/vienna/features'
import { SingleImage } from '@/components/headcode/themes/vienna/image'
import { Text, TextData } from '@/components/headcode/themes/vienna/text'
import { getSections } from '@/lib/headcode'
import { cacheTag } from 'next/cache'
import { Fragment } from 'react/jsx-runtime'
import { Hero, HeroData } from '../../components/headcode/themes/custom/hero'
import { Code } from '@/components/headcode/themes/custom/code'

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
        <Container className="py-4 lg:py-8">
          <Features sectionData={section.data} />
        </Container>
      )}
      {section.name === 'text' && (
        <Container className="py-4 lg:py-8">
          <Text sectionData={section.data} />
        </Container>
      )}
      {section.name === 'image' && (
        <div className="py-4 lg:py-8">
          <div className="mx-auto -mt-8 rounded-lg border p-4 sm:-mt-16 sm:max-w-3xl">
            <SingleImage sectionData={section.data} />
          </div>
        </div>
      )}
      {section.name === 'code' && (
        <Container className="py-4 lg:py-8">
          <Code sectionData={section.data} />
        </Container>
      )}
    </Fragment>
  ))
}

const defaultHero: HeroData = {
  title: 'A Minimalistic Web CMS',
  features: [
    {
      title: 'Published as a shadcn repository',
    },
    {
      title: 'Optimzied for Next.js 16 Cache Components',
    },
    {
      title: 'Publish your own themes, UI sections, and field types',
    },
    {
      title: 'Generate layouts and themes with AI tools and agents',
    },
  ],
  snippets: [
    {
      title: 'pnpm',
      code: 'npx kibo-ui@latest add snippet',
    },
  ],
  snippetsSublines: [
    {
      line: 'Default: SQLite (file), Better Auth, file storage',
    },
    {
      line: 'Best for local dev and tryout - no SAAS services required.',
    },
  ],
  databases: [
    {
      name: 'SQLite (file)',
      available: true,
    },
    {
      name: 'Turso Cloud',
      available: true,
    },
    {
      name: 'Postgres (soon)',
      available: false,
    },
  ],
  storages: [
    {
      name: 'File Storage',
      available: true,
    },
    {
      name: 'Vercel BLOB',
      available: true,
    },
    {
      name: 'Uploadthing (soon)',
      available: false,
    },
  ],
  auths: [
    {
      name: 'Better Auth',
      available: true,
    },
    {
      name: 'Clerk (soon)',
      available: false,
    },
  ],
  primaryButton: {
    title: 'Get Started',
    url: '/docs',
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
