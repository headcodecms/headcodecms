import {
  DocsMetaData,
  docsMetaSection,
} from '@/app/(site)/docs/[slug]/docs-meta'
import { Footer, FooterData } from '@/components/headcode/themes/custom/footer'
import { Container } from '@/components/headcode/themes/vienna/container'
import { getEntriesWithSections, getSection } from '@/lib/headcode'
import HeadcodeLogo from '@/public/headcode-logo.svg'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { cacheTag } from 'next/cache'
import {
  Header,
  HeaderData,
} from '../../components/headcode/themes/custom/header'
import './globals.css'

export const metadata: Metadata = {
  title: 'A Minimalistic Web CMS for Next.js',
  description:
    'Add web CMS functionality to your Next.js project as easy as any other shadcn/ui component. Optimzied for Next.js 16 Cache Components.',
  openGraph: {
    title: 'A Minimalistic Web CMS for Next.js',
    description:
      'Add web CMS functionality to your Next.js project as easy as any other shadcn/ui component. Optimzied for Next.js 16 Cache Components.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <HeaderSection />
        {children}
        <FooterSection />
        <Analytics />
      </body>
    </html>
  )
}

async function HeaderSection() {
  'use cache'
  cacheTag('/headcode/entries')
  cacheTag('/headcode/entries/global/header')

  const section = await getSection('global', 'header', 'header')
  const entries = await getEntriesWithSections('docs', { name: 'docs-meta' })

  return (
    <Container className="py-8">
      <Header
        sectionData={section ? section.data : defaultHeader}
        entries={entries}
      />
    </Container>
  )
}

async function FooterSection() {
  'use cache'
  cacheTag('/headcode/entries/global/footer')

  const section = await getSection('global', 'footer', 'footer')
  return (
    <Container className="text-muted-foreground py-8">
      <Footer sectionData={section ? section.data : defaultFooter} />
    </Container>
  )
}

const defaultHeader: HeaderData = {
  logo: HeadcodeLogo,
  name: 'Headcode CMS',
  nav: [
    {
      link: {
        title: 'Docs',
        url: '/docs',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Community',
        url: '/community',
        openInNewWindow: false,
      },
    },
  ],
}

const defaultFooter: FooterData = {
  company: 'Headcode CMS',
  nav: [
    {
      link: {
        title: 'Docs',
        url: '/docs',
        openInNewWindow: false,
      },
    },
    {
      link: {
        title: 'Community',
        url: '/community',
        openInNewWindow: false,
      },
    },
  ],
  social: [
    {
      link: {
        title: 'Github',
        url: 'https://github.com/headcodecms/headcodecms',
        openInNewWindow: true,
      },
      icon: 'github',
    },
  ],
}
