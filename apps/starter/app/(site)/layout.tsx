import { Container } from '@/components/headcode/themes/vienna/container'
import { Footer } from '@/components/headcode/themes/vienna/footer'
import { Header } from '@/components/headcode/themes/vienna/header'
import {
  defaultFooter,
  defaultHeader,
} from '@/components/headcode/themes/vienna/defaults'
import { getSection } from '@/lib/headcode'
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
