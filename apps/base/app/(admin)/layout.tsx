import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { Suspense } from 'react'

import { cn } from '@/lib/utils'

import './admin.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Headcode Admin',
  description: 'Headcode CMS admin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'dark h-full antialiased',
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        {/* The admin is a client app; route params resolve at request time. */}
        <Suspense>{children}</Suspense>
      </body>
    </html>
  )
}
