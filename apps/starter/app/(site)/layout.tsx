import { Container } from '@/components/headcode/themes/vienna/container'
import { Footer, FooterData } from '@/components/headcode/themes/vienna/footer'
import { Header, HeaderData } from '@/components/headcode/themes/vienna/header'
import { getSection } from '@/lib/headcode'
import DefaultLogo from '@/public/headcode-logo.svg'
import type { Metadata } from 'next'
import { cacheTag } from 'next/cache'
import './globals.css'

export const metadata: Metadata = {
  title: 'Headcode CMS Starter Theme Vienna',
  description: 'A minimalistic web content management system for Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="">
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
    {
      link: {
        title: 'Pages',
        url: '/pages',
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
