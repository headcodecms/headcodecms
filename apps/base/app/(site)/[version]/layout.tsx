import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { Geist_Mono, Inter } from 'next/font/google'

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

// Pages render per request from the content cache (_lib/headcode.ts), so the
// build does not need a running backend.
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
        {headerProps ? <SiteHeader {...headerProps} /> : null}
        <main className="flex-1">{children}</main>
        {footerProps ? <SiteFooter {...footerProps} /> : null}
      </body>
    </html>
  )
}
