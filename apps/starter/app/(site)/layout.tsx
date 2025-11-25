import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
