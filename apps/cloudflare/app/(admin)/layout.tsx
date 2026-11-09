import type { Metadata } from 'next'
// One font per import: vinext names the font chunk after the list, and a
// comma in the file name breaks the Node build (`vinext start`).
import { Geist_Mono } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './admin.css'
import { AdminProvider } from './_components/admin-provider'
import { cn } from '@/lib/utils'

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
        'dark h-full',
        'antialiased',
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        {/* The admin is a client app; route params resolve at request time. */}
        <Suspense>
          <AdminProvider>{children}</AdminProvider>
        </Suspense>
      </body>
    </html>
  )
}
