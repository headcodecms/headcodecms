import { Header, HeaderData } from '@/components/headcode/themes/vienna/header'
import { getSection } from '@/lib/headcode'
import DefaultLogo from '@/public/headcode-logo.svg'
import { cacheTag } from 'next/cache'
import { Footer, FooterData } from '@/components/headcode/themes/vienna/footer'
import { HomepageSection } from './section-home'
import { Container } from '@/components/headcode/themes/vienna/container'

export default function Home() {
  return (
    <>
      <HeaderSection />
      <HomepageSection />
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

async function FooterSection() {
  'use cache'
  cacheTag('/headcode/entries/global/footer')

  const section = await getSection('global', 'footer', 'footer')
  return (
    <Container className="bg-muted text-muted-foreground py-16">
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
}

const defaultFooter: FooterData = {
  company: '© 2026 Heacode CMS. All rights reserved.',
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
