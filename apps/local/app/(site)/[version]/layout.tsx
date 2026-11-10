import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
// One font per import: vinext names the font chunk after the list, and a
// comma in the file name breaks the Node build (`vinext start`).
import { Geist_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { SiteFooter, SiteHeader } from '@/app/(site)/_components/chrome'
import { EntriesDialog } from '@/app/(site)/_components/entries-dialog'
import { SiteStyles } from '@/app/(site)/_components/site-styles'
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
    robots: version === 'draft' ? { index: false, follow: false } : undefined,
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

// Live and draft are prerendered separately (see siteVersion for others).
export const generateStaticParams = () => [
  { version: 'live' },
  { version: 'draft' },
]

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Render pages per request from the (consistent) data cache. vinext's page
  // ISR cache does not reliably expire after writes, so pages are not cached.
  await connection()
  const { header, footer } = await getHeadcodeSiteChrome(await siteVersion())
  const headerProps = chromeProps<HeaderData>(header, 'header')
  const footerProps = chromeProps<FooterData>(footer, 'footer')

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
        <SiteStyles />
        {headerProps ? <SiteHeader {...headerProps} /> : null}
        <main className="flex-1">{children}</main>
        {footerProps ? <SiteFooter {...footerProps} /> : null}
        <Suspense>
          <EntriesDialog />
        </Suspense>
      </body>
    </html>
  )
}
