'use client'

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth'

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // If no App ID is configured, render children without Privy
  if (!appId || appId === 'your_privy_app_id_here') {
    console.warn('Privy App ID not configured. Please add NEXT_PUBLIC_PRIVY_APP_ID to your .env file')
    return <>{children}</>
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#0000ff',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}

