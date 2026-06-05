import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter } from 'next/font/google'
import { connection } from 'next/server'
import './site.css'
import { EntriesDialog } from './_components/entries-dialog'
import { SiteFooter, SiteHeader } from './_components/chrome'
import {
  getHeadcodeGlobal,
  getHeadcodeSiteChrome,
  getMeta,
  getSection,
} from './_lib/headcode'
import type { FooterData, HeaderData } from '@/headcode/sections'
import { getDataHeadcodeAttribute } from '@/headcode/utils'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const generateMetadata = async (): Promise<Metadata> => {
  const home = await getHeadcodeGlobal('home')
  const metadataContent = home ? getMeta(home) : null

  return {
    title: metadataContent?.title,
    description: metadataContent?.description,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await connection()

  const { header, footer } = await getHeadcodeSiteChrome()
  const headerSection = header
    ? getSection<HeaderData>(header.sections, 'header')
    : undefined
  const footerSection = footer
    ? getSection<FooterData>(footer.sections, 'footer')
    : undefined

  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        {header && headerSection ? (
          <SiteHeader
            data={headerSection.data}
            headcode={getDataHeadcodeAttribute(header.entry, headerSection)}
          />
        ) : null}
        <main className="flex-1">{children}</main>
        {footer && footerSection ? (
          <SiteFooter
            data={footerSection.data}
            headcode={getDataHeadcodeAttribute(footer.entry, footerSection)}
          />
        ) : null}
        <EntriesDialog />
      </body>
    </html>
  )
}
