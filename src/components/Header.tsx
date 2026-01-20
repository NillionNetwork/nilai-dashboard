'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useCreateUser } from '@/hooks/useCreateUser'
import { useUserCredits } from '@/hooks/useUserCredits'

export default function Header() {
  const { ready, authenticated, login, logout } = usePrivy()
  useCreateUser() // Automatically create user when authenticated
  const { balance, loading } = useUserCredits()

  const handleAuth = () => {
    if (authenticated) {
      logout()
    } else {
      login()
    }
  }

  return (
    <header className="sticky top-0 z-10 group" style={{ backgroundColor: 'var(--nillion-bg)', borderBottom: '1px solid var(--nillion-border)' }}>
      <div className="px-8 py-4 flex items-center justify-end">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <a href="https://docs.nillion.com/build/private-llms/quickstart" target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:opacity-80 transition-opacity">Docs</a>
            <a href="https://api.nilai.nillion.network/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:opacity-80 transition-opacity">API reference</a>
          </nav>
          
          <div className="flex items-center gap-4">
            {authenticated && (
              <Link 
                href="/credits" 
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer hover:opacity-90 animate-pulse-slow"
                style={{ 
                  backgroundColor: 'var(--nillion-primary-lightest)', 
                  color: '#1e3a8a',
                  border: '1px solid var(--nillion-primary-lighter)'
                }}
              >
                Credits: {loading ? '...' : `$${balance?.toFixed(2) ?? '0.00'}`}
              </Link>
            )}
            <button 
              type="button" 
              onClick={handleAuth}
              disabled={!ready}
              className="px-4 py-2 text-sm font-medium rounded-md border-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" 
              style={{ 
                backgroundColor: 'var(--nillion-primary)', 
                borderColor: 'var(--nillion-primary)',
                color: '#ffffff'
              }}
            >
              {!ready ? 'Loading...' : authenticated ? 'Logout' : 'Login with Privy'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
