import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { Suspense } from 'react'

import { previewToken, siteVersion } from '@/app/(site)/_lib/version'
import { PreviewBar } from '@/app/(site)/_components/preview-bar'

import { SiteFooter, SiteHeader } from '@/app/(site)/_components/chrome'
import {
  type EntryBundle,
  getDataHeadcodeAttribute,
  getHeadcodeGlobal,
  getHeadcodeSiteChrome,
  getMeta,
  getSection,
} from '@/app/(site)/_lib/headcode'
import { pageMetadata, siteUrl } from '@/app/(site)/_lib/seo'
import type { FooterData, HeaderData } from '@/headcode/sections'
import { cn } from '@/lib/utils'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const generateMetadata = async (): Promise<Metadata> => {
  const version = await siteVersion()
  const home = await getHeadcodeGlobal(version, 'home')
  const meta = home && getMeta(home)
  return {
    metadataBase: new URL(siteUrl),
    ...pageMetadata({ ...meta, path: '/' }),
    // Draft content must not end up in search results.
    robots: version === 'live' ? undefined : { index: false, follow: false },
  }
}

const chromeProps = <TData,>(bundle: EntryBundle | null, name: string) => {
  const section = bundle && getSection<TData>(bundle.sections, name)
  return bundle && section
    ? {
        data: section.data,
        headcode: getDataHeadcodeAttribute(bundle.entry, section),
      }
    : null
}

// Live is prerendered; preview pages render per request.
export const generateStaticParams = () => [{ version: 'live' }]

// The version is known per request only for preview links, so everything
// that reads it sits in Suspense: live stays in the static shell.
const Header = async () => {
  const { header } = await getHeadcodeSiteChrome(await siteVersion())
  const props = chromeProps<HeaderData>(header, 'header')
  return props ? <SiteHeader {...props} /> : null
}

const Footer = async () => {
  const { footer } = await getHeadcodeSiteChrome(await siteVersion())
  const props = chromeProps<FooterData>(footer, 'footer')
  return props ? <SiteFooter {...props} /> : null
}

const Preview = async () => {
  const token = previewToken(await siteVersion())
  return token ? <PreviewBar token={token} /> : null
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full antialiased',
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <Suspense>
          <Preview />
        </Suspense>
        <Suspense>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense>
          <Footer />
        </Suspense>
      </body>
    </html>
  )
}
