'use client'

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
    ],
  },
  {
    section: 'OPTIMIZE',
    items: [
      { name: 'Docs', href: 'https://docs.nillion.com/blind-computer/build/llms/overview', external: true },
      { name: 'API reference', href: 'https://api.nilai.nillion.network/docs', external: true },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 h-full w-64 overflow-y-auto" style={{ backgroundColor: 'var(--nillion-bg)', borderRight: '1px solid var(--nillion-border)' }}>
      <div className="p-6">
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
                        }
                      : {
                          color: '#ffffff',
                          backgroundColor: 'transparent',
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
                            className="block px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            style={linkStyle}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'rgba(138, 137, 255, 0.1)'
                                e.currentTarget.style.color = '#ffffff'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#ffffff'
                              }
                            }}
                          >
                            {item.name}
                          </a>
                        ) : (
                          <Link
                            {...linkProps}
                            className="block px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            style={linkStyle}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'rgba(138, 137, 255, 0.1)'
                                e.currentTarget.style.color = '#ffffff'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#ffffff'
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
    </div>
  )
}
