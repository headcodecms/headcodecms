import type { Metadata } from 'next'
import { siteVersion } from '@/app/(site)/_lib/version'
import { Geist_Mono, Inter } from 'next/font/google'
import { Suspense } from 'react'

import '../../globals.css'
import { SiteFooter, SiteHeader } from '@/app/(site)/_components/chrome'
import { EntriesDialog } from '@/app/(site)/_components/entries-dialog'
import {
  type EntryBundle,
  getDataHeadcodeAttribute,
  getHeadcodeGlobal,
  getHeadcodeSiteChrome,
  getMeta,
  getSection,
} from '@/app/(site)/_lib/headcode'
import type { FooterData, HeaderData } from '@/headcode/sections'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const generateMetadata = async (): Promise<Metadata> => {
  const home = await getHeadcodeGlobal(await siteVersion(), 'home')
  const meta = home && getMeta(home)
  return { title: meta?.title, description: meta?.description }
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
        <Suspense>
          <EntriesDialog />
        </Suspense>
      </body>
    </html>
  )
}
