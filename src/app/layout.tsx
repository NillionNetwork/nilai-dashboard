import type { Metadata } from 'next'
import './globals.css'
import PrivyProvider from '@/components/PrivyProvider'

export const metadata: Metadata = {
  title: 'nilAI Dashboard',
  description: 'Developer Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/nillion.css" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  )
}
