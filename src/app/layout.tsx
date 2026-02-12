import type { Metadata } from 'next'
import './globals.css'
import PrivyProvider from '@/components/PrivyProvider'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

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
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--nillion-bg)' }}>
            <Sidebar />
            <div className="md:ml-64 md:border-l md:border-l-[var(--nillion-border)] flex flex-col flex-1">
              <Header />
              <main className="px-8 pt-8 pb-16 flex-1">
                {children}
              </main>
            </div>
            <Footer />
          </div>
        </PrivyProvider>
      </body>
    </html>
  )
}
