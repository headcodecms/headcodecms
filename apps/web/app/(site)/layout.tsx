import { Container } from '@/components/headcode/themes/vienna/container'
import { Footer, FooterData } from '@/components/headcode/themes/vienna/footer'
import { Header, HeaderData } from './header'
import { getSection } from '@/lib/headcode'
import type { Metadata } from 'next'
import { cacheTag } from 'next/cache'
import HeadcodeLogo from '@/public/headcode-logo.svg'

import './globals.css'

export const metadata: Metadata = {
  title: 'A Minimalistic Web CMS for Next.js',
  description:
    'Add web CMS functionality to your Next.js project as easy as any other shadcn/ui component. Optimzied for Next.js 16 Cache Components.',
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
      </body>
    </html>
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
