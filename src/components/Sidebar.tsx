'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  {
    section: 'GET STARTED',
    items: [
      { name: 'Quickstart', href: '/' },
      { name: 'SDKs', href: '/sdks' },
      { name: 'Models', href: '/models' },
    ],
  },
  {
    section: 'MANAGE',
    items: [
      { name: 'API keys', href: '/api-keys' },
      { name: 'Credits', href: '/credits' },
      { name: 'Usage', href: '/usage' },
    ],
  },
  {
    section: 'LEARN',
    items: [
      { name: 'Docs', href: 'https://docs.nillion.com/blind-computer/build/llms/overview', external: true },
      { name: 'API reference', href: 'https://api.nilai.nillion.network/docs', external: true },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const syncLayout = () => {
      const desktop = mediaQuery.matches
      setIsDesktop(desktop)
      if (desktop) {
        setIsOpen(false)
      }
    }

    syncLayout()

    mediaQuery.addEventListener('change', syncLayout)
    return () => mediaQuery.removeEventListener('change', syncLayout)
  }, [])

  return (
    <>
      {!isDesktop && !isOpen && (
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-md p-2"
          style={{ backgroundColor: 'var(--nillion-primary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {!isDesktop && isOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 overflow-y-auto transform transition-transform duration-200 z-50 md:z-10 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--nillion-bg)' }}
      >
        <div className="p-6">
          {!isDesktop && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-2"
                style={{ backgroundColor: 'var(--nillion-primary)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--nillion-primary)' }}>
              <img
                src="/favicon-32x32.png"
                alt="nilAI"
                width="32"
                height="32"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-white">nilAI Dashboard</span>
          </div>

          <nav className="space-y-6">
            {navigation.map((section) => (
                <div key={section.section}>
                  <h3
                    className="uppercase tracking-wider mb-3 px-3 text-white"
                    style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      opacity: 0.7
                    }}
                  >
                    {section.section}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = !item.external && pathname === item.href
                      const linkStyle = isActive
                        ? {
                            backgroundColor: 'var(--nillion-primary-lightest)',
                            color: '#1e3a8a',
                            fontWeight: '600',
                            textDecoration: 'none',
                          }
                        : {
                            color: '#ffffff',
                            backgroundColor: 'transparent',
                            textDecoration: 'none',
                          }

                      const linkProps = item.external
                        ? {
                            href: item.href,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                          }
                        : {
                            href: item.href,
                          }

                      return (
                        <li key={item.name}>
                          {item.external ? (
                            <a
                              {...linkProps}
                              className="block px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline hover:no-underline"
                              style={linkStyle}
                              onClick={() => setIsOpen(false)}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = 'rgba(138, 137, 255, 0.1)'
                                  e.currentTarget.style.color = '#ffffff'
                                  e.currentTarget.style.textDecoration = 'none'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#ffffff'
                                  e.currentTarget.style.textDecoration = 'none'
                                }
                              }}
                            >
                              {item.name}
                            </a>
                          ) : (
                            <Link
                              {...linkProps}
                              className="block px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline hover:no-underline"
                              style={linkStyle}
                              onClick={() => setIsOpen(false)}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = 'rgba(138, 137, 255, 0.1)'
                                  e.currentTarget.style.color = '#ffffff'
                                  e.currentTarget.style.textDecoration = 'none'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                  e.currentTarget.style.color = '#ffffff'
                                  e.currentTarget.style.textDecoration = 'none'
                                }
                              }}
                            >
                              {item.name}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
