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
      </head>
      <body suppressHydrationWarning>
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  )
}
